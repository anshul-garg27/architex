import { describe, it, expect } from "vitest";
import {
  createEmptyDiagram,
  addClass,
  removeClass,
  updateClass,
  addAttribute,
  removeAttribute,
  addMethod,
  removeMethod,
  addRelationship,
  removeRelationship,
  validateDiagram,
} from "../class-diagram-model";
import type { ClassDiagram } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDiagramWithClass(): { diagram: ClassDiagram; classId: string } {
  const d0 = createEmptyDiagram();
  const d1 = addClass(d0, {
    name: "User",
    stereotype: "class",
    attributes: [],
    methods: [],
    x: 0,
    y: 0,
  });
  const classId = d1.classes[0].id;
  return { diagram: d1, classId };
}

function makeDiagramWithTwoClasses() {
  const d0 = createEmptyDiagram();
  const d1 = addClass(d0, {
    name: "User",
    stereotype: "class",
    attributes: [],
    methods: [],
    x: 0,
    y: 0,
  });
  const d2 = addClass(d1, {
    name: "Order",
    stereotype: "class",
    attributes: [],
    methods: [],
    x: 200,
    y: 0,
  });
  return {
    diagram: d2,
    userId: d2.classes[0].id,
    orderId: d2.classes[1].id,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("class-diagram-model", () => {
  // -- createEmptyDiagram -------------------------------------------

  describe("createEmptyDiagram", () => {
    it("returns a diagram with empty classes and relationships", () => {
      const d = createEmptyDiagram();
      expect(d.classes).toEqual([]);
      expect(d.relationships).toEqual([]);
    });
  });

  // -- addClass -----------------------------------------------------

  describe("addClass", () => {
    it("adds a class with a generated id", () => {
      const { diagram } = makeDiagramWithClass();
      expect(diagram.classes).toHaveLength(1);
      expect(diagram.classes[0].name).toBe("User");
      expect(diagram.classes[0].id).toBeTruthy();
    });

    it("preserves existing classes (immutable)", () => {
      const d0 = createEmptyDiagram();
      const d1 = addClass(d0, {
        name: "A",
        stereotype: "class",
        attributes: [],
        methods: [],
        x: 0,
        y: 0,
      });
      const d2 = addClass(d1, {
        name: "B",
        stereotype: "interface",
        attributes: [],
        methods: [],
        x: 100,
        y: 0,
      });
      expect(d1.classes).toHaveLength(1);
      expect(d2.classes).toHaveLength(2);
      // original unchanged
      expect(d0.classes).toHaveLength(0);
    });
  });

  // -- removeClass --------------------------------------------------

  describe("removeClass", () => {
    it("removes a class by id", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = removeClass(diagram, classId);
      expect(d2.classes).toHaveLength(0);
    });

    it("also removes relationships referencing the class", () => {
      const { diagram, userId, orderId } = makeDiagramWithTwoClasses();
      const withRel = addRelationship(diagram, {
        source: userId,
        target: orderId,
        type: "association",
      });
      expect(withRel.relationships).toHaveLength(1);

      const removed = removeClass(withRel, userId);
      expect(removed.classes).toHaveLength(1);
      expect(removed.relationships).toHaveLength(0);
    });

    it("is a no-op for a non-existent id", () => {
      const { diagram } = makeDiagramWithClass();
      const d2 = removeClass(diagram, "non-existent");
      expect(d2.classes).toHaveLength(1);
    });
  });

  // -- updateClass --------------------------------------------------

  describe("updateClass", () => {
    it("partial-updates a class name", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = updateClass(diagram, classId, { name: "Customer" });
      expect(d2.classes[0].name).toBe("Customer");
      expect(d2.classes[0].stereotype).toBe("class");
    });

    it("partial-updates stereotype", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = updateClass(diagram, classId, { stereotype: "abstract" });
      expect(d2.classes[0].stereotype).toBe("abstract");
    });

    it("does not mutate the original diagram", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = updateClass(diagram, classId, { name: "Renamed" });
      expect(diagram.classes[0].name).toBe("User");
      expect(d2.classes[0].name).toBe("Renamed");
    });
  });

  // -- addAttribute / removeAttribute --------------------------------

  describe("addAttribute", () => {
    it("adds an attribute to the target class", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = addAttribute(diagram, classId, {
        name: "email",
        type: "string",
        visibility: "-",
      });
      expect(d2.classes[0].attributes).toHaveLength(1);
      expect(d2.classes[0].attributes[0].name).toBe("email");
      expect(d2.classes[0].attributes[0].id).toBeTruthy();
    });

    it("uses a supplied id when provided", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = addAttribute(diagram, classId, {
        id: "custom-id",
        name: "email",
        type: "string",
        visibility: "+",
      });
      expect(d2.classes[0].attributes[0].id).toBe("custom-id");
    });
  });

  describe("removeAttribute", () => {
    it("removes an attribute by id", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = addAttribute(diagram, classId, {
        id: "a1",
        name: "email",
        type: "string",
        visibility: "-",
      });
      const d3 = addAttribute(d2, classId, {
        id: "a2",
        name: "name",
        type: "string",
        visibility: "+",
      });
      expect(d3.classes[0].attributes).toHaveLength(2);

      const d4 = removeAttribute(d3, classId, "a1");
      expect(d4.classes[0].attributes).toHaveLength(1);
      expect(d4.classes[0].attributes[0].id).toBe("a2");
    });
  });

  // -- addMethod / removeMethod -------------------------------------

  describe("addMethod", () => {
    it("adds a method to the target class", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = addMethod(diagram, classId, {
        name: "getEmail",
        returnType: "string",
        params: [],
        visibility: "+",
      });
      expect(d2.classes[0].methods).toHaveLength(1);
      expect(d2.classes[0].methods[0].name).toBe("getEmail");
      expect(d2.classes[0].methods[0].id).toBeTruthy();
    });
  });

  describe("removeMethod", () => {
    it("removes a method by id", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = addMethod(diagram, classId, {
        id: "m1",
        name: "getEmail",
        returnType: "string",
        params: [],
        visibility: "+",
      });
      const d3 = addMethod(d2, classId, {
        id: "m2",
        name: "setEmail",
        returnType: "void",
        params: ["email: string"],
        visibility: "+",
      });
      expect(d3.classes[0].methods).toHaveLength(2);

      const d4 = removeMethod(d3, classId, "m1");
      expect(d4.classes[0].methods).toHaveLength(1);
      expect(d4.classes[0].methods[0].id).toBe("m2");
    });
  });

  // -- addRelationship / removeRelationship -------------------------

  describe("addRelationship", () => {
    it("adds a relationship between two classes", () => {
      const { diagram, userId, orderId } = makeDiagramWithTwoClasses();
      const d2 = addRelationship(diagram, {
        source: userId,
        target: orderId,
        type: "composition",
        label: "has",
      });
      expect(d2.relationships).toHaveLength(1);
      expect(d2.relationships[0].source).toBe(userId);
      expect(d2.relationships[0].target).toBe(orderId);
      expect(d2.relationships[0].type).toBe("composition");
      expect(d2.relationships[0].id).toBeTruthy();
    });
  });

  describe("removeRelationship", () => {
    it("removes a relationship by id", () => {
      const { diagram, userId, orderId } = makeDiagramWithTwoClasses();
      const d2 = addRelationship(diagram, {
        id: "r1",
        source: userId,
        target: orderId,
        type: "association",
      });
      const d3 = removeRelationship(d2, "r1");
      expect(d3.relationships).toHaveLength(0);
    });
  });

  // -- validateDiagram ----------------------------------------------

  describe("validateDiagram", () => {
    it("returns valid for an empty diagram", () => {
      const result = validateDiagram(createEmptyDiagram());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("returns valid for a well-formed diagram", () => {
      const { diagram, userId, orderId } = makeDiagramWithTwoClasses();
      const d2 = addRelationship(diagram, {
        source: userId,
        target: orderId,
        type: "association",
      });
      const result = validateDiagram(d2);
      expect(result.valid).toBe(true);
    });

    it("detects duplicate class names", () => {
      const d0 = createEmptyDiagram();
      const d1 = addClass(d0, {
        name: "User",
        stereotype: "class",
        attributes: [],
        methods: [],
        x: 0,
        y: 0,
      });
      const d2 = addClass(d1, {
        name: "User",
        stereotype: "class",
        attributes: [],
        methods: [],
        x: 200,
        y: 0,
      });
      const result = validateDiagram(d2);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Duplicate class name");
      expect(result.errors[0]).toContain("User");
    });

    it("detects relationships with non-existent source", () => {
      const { diagram, orderId } = makeDiagramWithTwoClasses();
      const d2 = addRelationship(diagram, {
        id: "bad-rel",
        source: "ghost",
        target: orderId,
        type: "dependency",
      });
      const result = validateDiagram(d2);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("non-existent source"))).toBe(true);
    });

    it("detects relationships with non-existent target", () => {
      const { diagram, userId } = makeDiagramWithTwoClasses();
      const d2 = addRelationship(diagram, {
        id: "bad-rel",
        source: userId,
        target: "ghost",
        type: "dependency",
      });
      const result = validateDiagram(d2);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("non-existent target"))).toBe(true);
    });

    it("detects self-relationships", () => {
      const { diagram, classId } = makeDiagramWithClass();
      const d2 = addRelationship(diagram, {
        id: "self-rel",
        source: classId,
        target: classId,
        type: "association",
      });
      const result = validateDiagram(d2);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("self-relationship"))).toBe(true);
    });

    it("reports multiple errors at once", () => {
      const d0 = createEmptyDiagram();
      const d1 = addClass(d0, {
        name: "Dup",
        stereotype: "class",
        attributes: [],
        methods: [],
        x: 0,
        y: 0,
      });
      const d2 = addClass(d1, {
        name: "Dup",
        stereotype: "class",
        attributes: [],
        methods: [],
        x: 100,
        y: 0,
      });
      const classId = d2.classes[0].id;
      const d3 = addRelationship(d2, {
        id: "self",
        source: classId,
        target: classId,
        type: "association",
      });
      const d4 = addRelationship(d3, {
        id: "ghost",
        source: "no-exist",
        target: "also-no",
        type: "dependency",
      });
      const result = validateDiagram(d4);
      expect(result.valid).toBe(false);
      // duplicate name + self-rel + 2 ghost refs = at least 4 errors
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  // -- Immutability -------------------------------------------------

  describe("immutability", () => {
    it("addClass does not mutate original diagram", () => {
      const d0 = createEmptyDiagram();
      addClass(d0, {
        name: "X",
        stereotype: "class",
        attributes: [],
        methods: [],
        x: 0,
        y: 0,
      });
      expect(d0.classes).toHaveLength(0);
    });

    it("addAttribute does not mutate original class attributes", () => {
      const { diagram, classId } = makeDiagramWithClass();
      addAttribute(diagram, classId, {
        name: "x",
        type: "int",
        visibility: "+",
      });
      expect(diagram.classes[0].attributes).toHaveLength(0);
    });

    it("addMethod does not mutate original class methods", () => {
      const { diagram, classId } = makeDiagramWithClass();
      addMethod(diagram, classId, {
        name: "run",
        returnType: "void",
        params: [],
        visibility: "+",
      });
      expect(diagram.classes[0].methods).toHaveLength(0);
    });

    it("addRelationship does not mutate original relationships", () => {
      const { diagram, userId, orderId } = makeDiagramWithTwoClasses();
      addRelationship(diagram, {
        source: userId,
        target: orderId,
        type: "association",
      });
      expect(diagram.relationships).toHaveLength(0);
    });
  });
});
