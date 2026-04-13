import { describe, it, expect } from 'vitest';
import { erToSQL, erToNoSQL } from '../schema-converter';
import type { EREntity, ERRelationship } from '../types';

// ── Helpers ────────────────────────────────────────────────

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-test-${idCounter}`;
}

function makeEntity(
  name: string,
  attrs: Array<{
    name: string;
    type: string;
    isPK?: boolean;
    isFK?: boolean;
    isDerived?: boolean;
    isMultivalued?: boolean;
  }>,
  isWeak = false,
): EREntity {
  const id = nextId('entity');
  return {
    id,
    name,
    isWeak,
    attributes: attrs.map((a) => ({
      id: nextId('attr'),
      name: a.name,
      isPK: a.isPK ?? false,
      isFK: a.isFK ?? false,
      type: a.type,
      isDerived: a.isDerived,
      isMultivalued: a.isMultivalued,
    })),
    x: 0,
    y: 0,
  };
}

function makeRelationship(
  name: string,
  entity1Id: string,
  entity2Id: string,
  cardinality: '1:1' | '1:N' | 'M:N',
): ERRelationship {
  return {
    id: nextId('rel'),
    name,
    entity1Id,
    entity2Id,
    cardinality,
  };
}

// ── erToSQL Tests ──────────────────────────────────────────

describe('erToSQL', () => {
  it('generates CREATE TABLE for a single entity with primary key', () => {
    const user = makeEntity('Users', [
      { name: 'user_id', type: 'SERIAL', isPK: true },
      { name: 'email', type: 'VARCHAR' },
      { name: 'name', type: 'VARCHAR' },
    ]);

    const result = erToSQL([user], []);

    expect(result.sql).toContain('CREATE TABLE users');
    expect(result.sql).toContain('user_id SERIAL NOT NULL');
    expect(result.sql).toContain('email VARCHAR(255)');
    expect(result.sql).toContain('PRIMARY KEY (user_id)');
    expect(result.tables).toContain('users');
    expect(result.junctionTables).toHaveLength(0);
  });

  it('handles 1:1 relationship with UNIQUE FK', () => {
    const user = makeEntity('Users', [
      { name: 'user_id', type: 'SERIAL', isPK: true },
      { name: 'name', type: 'VARCHAR' },
    ]);
    const profile = makeEntity('Profiles', [
      { name: 'profile_id', type: 'SERIAL', isPK: true },
      { name: 'bio', type: 'TEXT' },
    ]);

    const rel = makeRelationship('has_profile', user.id, profile.id, '1:1');
    const result = erToSQL([user, profile], [rel]);

    // FK should be on profiles table (entity2)
    expect(result.sql).toContain('CREATE TABLE profiles');
    expect(result.sql).toContain('users_user_id INTEGER NOT NULL');
    expect(result.sql).toContain('FOREIGN KEY (users_user_id) REFERENCES users(user_id)');
    expect(result.sql).toContain('UNIQUE (users_user_id)');
    expect(result.junctionTables).toHaveLength(0);
  });

  it('handles 1:N relationship with FK on N-side', () => {
    const dept = makeEntity('Departments', [
      { name: 'dept_id', type: 'SERIAL', isPK: true },
      { name: 'name', type: 'VARCHAR' },
    ]);
    const emp = makeEntity('Employees', [
      { name: 'emp_id', type: 'SERIAL', isPK: true },
      { name: 'name', type: 'VARCHAR' },
    ]);

    const rel = makeRelationship('works_in', dept.id, emp.id, '1:N');
    const result = erToSQL([dept, emp], [rel]);

    // FK on employees (N-side)
    expect(result.sql).toContain('departments_dept_id INTEGER NOT NULL');
    expect(result.sql).toContain(
      'FOREIGN KEY (departments_dept_id) REFERENCES departments(dept_id)',
    );
    // No UNIQUE constraint on 1:N
    expect(result.sql).not.toContain('UNIQUE (departments_dept_id)');
    expect(result.junctionTables).toHaveLength(0);
  });

  it('handles M:N relationship with junction table', () => {
    const student = makeEntity('Students', [
      { name: 'student_id', type: 'SERIAL', isPK: true },
      { name: 'name', type: 'VARCHAR' },
    ]);
    const course = makeEntity('Courses', [
      { name: 'course_id', type: 'SERIAL', isPK: true },
      { name: 'title', type: 'VARCHAR' },
    ]);

    const rel = makeRelationship('enrolls', student.id, course.id, 'M:N');
    const result = erToSQL([student, course], [rel]);

    // Junction table
    expect(result.sql).toContain('CREATE TABLE students_courses');
    expect(result.sql).toContain('students_student_id SERIAL NOT NULL');
    expect(result.sql).toContain('courses_course_id SERIAL NOT NULL');
    expect(result.sql).toContain(
      'PRIMARY KEY (students_student_id, courses_course_id)',
    );
    expect(result.sql).toContain(
      'FOREIGN KEY (students_student_id) REFERENCES students(student_id)',
    );
    expect(result.sql).toContain(
      'FOREIGN KEY (courses_course_id) REFERENCES courses(course_id)',
    );
    expect(result.junctionTables).toContain('students_courses');
  });

  it('skips derived attributes in SQL output', () => {
    const entity = makeEntity('Products', [
      { name: 'product_id', type: 'SERIAL', isPK: true },
      { name: 'price', type: 'DECIMAL' },
      { name: 'discounted_price', type: 'DECIMAL', isDerived: true },
    ]);

    const result = erToSQL([entity], []);

    expect(result.sql).toContain('price DECIMAL(10,2)');
    expect(result.sql).not.toContain('discounted_price');
  });

  it('generates correct SQL for multiple relationships on same entity', () => {
    const user = makeEntity('Users', [
      { name: 'user_id', type: 'SERIAL', isPK: true },
    ]);
    const post = makeEntity('Posts', [
      { name: 'post_id', type: 'SERIAL', isPK: true },
    ]);
    const comment = makeEntity('Comments', [
      { name: 'comment_id', type: 'SERIAL', isPK: true },
    ]);

    const rel1 = makeRelationship('writes', user.id, post.id, '1:N');
    const rel2 = makeRelationship('has', post.id, comment.id, '1:N');
    const result = erToSQL([user, post, comment], [rel1, rel2]);

    // Posts should have users FK
    expect(result.sql).toContain(
      'FOREIGN KEY (users_user_id) REFERENCES users(user_id)',
    );
    // Comments should have posts FK
    expect(result.sql).toContain(
      'FOREIGN KEY (posts_post_id) REFERENCES posts(post_id)',
    );
  });

  it('returns correct table and junction table lists', () => {
    const a = makeEntity('Authors', [
      { name: 'author_id', type: 'SERIAL', isPK: true },
    ]);
    const b = makeEntity('Books', [
      { name: 'book_id', type: 'SERIAL', isPK: true },
    ]);
    const r = makeEntity('Readers', [
      { name: 'reader_id', type: 'SERIAL', isPK: true },
    ]);

    const rel1 = makeRelationship('writes', a.id, b.id, 'M:N');
    const rel2 = makeRelationship('reads', r.id, b.id, '1:N');
    const result = erToSQL([a, b, r], [rel1, rel2]);

    expect(result.tables).toEqual(['authors', 'books', 'readers']);
    expect(result.junctionTables).toEqual(['authors_books']);
  });
});

// ── erToNoSQL Tests ────────────────────────────────────────

describe('erToNoSQL', () => {
  it('generates a collection for a single entity', () => {
    const user = makeEntity('Users', [
      { name: 'user_id', type: 'SERIAL', isPK: true },
      { name: 'email', type: 'VARCHAR' },
    ]);

    const result = erToNoSQL([user], []);

    expect(result.collections).toHaveLength(1);
    expect(result.collections[0].name).toBe('users');
    // PK mapped to _id
    expect(result.collections[0].fields.find((f) => f.name === '_id')).toBeDefined();
    expect(result.collections[0].fields.find((f) => f.name === 'email')?.type).toBe(
      'String',
    );
  });

  it('handles 1:1 relationship as reference on entity2', () => {
    const user = makeEntity('Users', [
      { name: 'user_id', type: 'SERIAL', isPK: true },
    ]);
    const profile = makeEntity('Profiles', [
      { name: 'profile_id', type: 'SERIAL', isPK: true },
    ]);

    const rel = makeRelationship('has_profile', user.id, profile.id, '1:1');
    const result = erToNoSQL([user, profile], [rel]);

    const profileColl = result.collections.find((c) => c.name === 'profiles');
    expect(profileColl).toBeDefined();
    const refField = profileColl!.fields.find((f) => f.name === 'usersId');
    expect(refField).toBeDefined();
    expect(refField!.isRef).toBe(true);
    expect(refField!.type).toBe('ObjectId');
  });

  it('handles 1:N relationship as reference on N-side', () => {
    const dept = makeEntity('Departments', [
      { name: 'dept_id', type: 'SERIAL', isPK: true },
    ]);
    const emp = makeEntity('Employees', [
      { name: 'emp_id', type: 'SERIAL', isPK: true },
    ]);

    const rel = makeRelationship('works_in', dept.id, emp.id, '1:N');
    const result = erToNoSQL([dept, emp], [rel]);

    const empColl = result.collections.find((c) => c.name === 'employees');
    const refField = empColl!.fields.find((f) => f.name === 'departmentsId');
    expect(refField).toBeDefined();
    expect(refField!.isRef).toBe(true);
    expect(refField!.isArray).toBeUndefined();
  });

  it('handles M:N relationship as array refs on both sides', () => {
    const student = makeEntity('Students', [
      { name: 'student_id', type: 'SERIAL', isPK: true },
    ]);
    const course = makeEntity('Courses', [
      { name: 'course_id', type: 'SERIAL', isPK: true },
    ]);

    const rel = makeRelationship('enrolls', student.id, course.id, 'M:N');
    const result = erToNoSQL([student, course], [rel]);

    const studentColl = result.collections.find((c) => c.name === 'students');
    const courseColl = result.collections.find((c) => c.name === 'courses');

    const studentRef = studentColl!.fields.find((f) => f.name === 'coursesIds');
    expect(studentRef).toBeDefined();
    expect(studentRef!.isArray).toBe(true);
    expect(studentRef!.isRef).toBe(true);

    const courseRef = courseColl!.fields.find((f) => f.name === 'studentsIds');
    expect(courseRef).toBeDefined();
    expect(courseRef!.isArray).toBe(true);
    expect(courseRef!.isRef).toBe(true);
  });

  it('maps multivalued attributes to arrays', () => {
    const entity = makeEntity('Contacts', [
      { name: 'contact_id', type: 'SERIAL', isPK: true },
      { name: 'phone_numbers', type: 'VARCHAR', isMultivalued: true },
    ]);

    const result = erToNoSQL([entity], []);
    const coll = result.collections[0];
    const phoneField = coll.fields.find((f) => f.name === 'phoneNumbers');
    expect(phoneField).toBeDefined();
    expect(phoneField!.isArray).toBe(true);
  });

  it('skips derived attributes in NoSQL output', () => {
    const entity = makeEntity('Products', [
      { name: 'product_id', type: 'SERIAL', isPK: true },
      { name: 'price', type: 'DECIMAL' },
      { name: 'discounted_price', type: 'DECIMAL', isDerived: true },
    ]);

    const result = erToNoSQL([entity], []);
    const coll = result.collections[0];
    const fieldNames = coll.fields.map((f) => f.name);
    expect(fieldNames).toContain('price');
    expect(fieldNames).not.toContain('discountedPrice');
  });
});
