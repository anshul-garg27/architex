/**
 * Sample ER Diagrams (DBL-011)
 *
 * Pre-built ER diagram examples for quick loading:
 * 1. E-commerce (Users, Products, Orders, OrderItems, Reviews)
 * 2. Social Media (Users, Posts, Comments, Likes, Follows)
 * 3. Library (Books, Authors, Members, Loans)
 */

import type { EREntity, ERRelationship } from "./types";

export interface SampleERDiagram {
  name: string;
  description: string;
  entities: EREntity[];
  relationships: ERRelationship[];
}

// ── ID Generation ──────────────────────────────────────────────
// Each sample builder receives its own counter factory so IDs are
// deterministic within a sample and non-overlapping across samples.

function createIdGenerator(samplePrefix: string) {
  let counter = 0;
  return (kind: string): string => {
    counter += 1;
    return `${kind}-${samplePrefix}-${counter}`;
  };
}

// ── E-commerce ─────────────────────────────────────────────────

function buildEcommerce(): SampleERDiagram {
  const sampleId = createIdGenerator("ecom");

  const usersId = sampleId("entity");
  const productsId = sampleId("entity");
  const ordersId = sampleId("entity");
  const orderItemsId = sampleId("entity");
  const reviewsId = sampleId("entity");

  const entities: EREntity[] = [
    {
      id: usersId,
      name: "Users",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "user_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "email", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "name", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "created_at", isPK: false, isFK: false, type: "TIMESTAMP" },
      ],
      x: 80,
      y: 60,
    },
    {
      id: productsId,
      name: "Products",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "product_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "name", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "price", isPK: false, isFK: false, type: "DECIMAL" },
        { id: sampleId("attr"), name: "stock", isPK: false, isFK: false, type: "INT" },
      ],
      x: 550,
      y: 60,
    },
    {
      id: ordersId,
      name: "Orders",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "order_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "user_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "order_date", isPK: false, isFK: false, type: "TIMESTAMP" },
        { id: sampleId("attr"), name: "total", isPK: false, isFK: false, type: "DECIMAL" },
      ],
      x: 80,
      y: 320,
    },
    {
      id: orderItemsId,
      name: "OrderItems",
      isWeak: true,
      attributes: [
        { id: sampleId("attr"), name: "item_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "order_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "product_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "quantity", isPK: false, isFK: false, type: "INT" },
        { id: sampleId("attr"), name: "price", isPK: false, isFK: false, type: "DECIMAL" },
      ],
      x: 380,
      y: 320,
    },
    {
      id: reviewsId,
      name: "Reviews",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "review_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "user_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "product_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "rating", isPK: false, isFK: false, type: "INT" },
        { id: sampleId("attr"), name: "comment", isPK: false, isFK: false, type: "TEXT" },
      ],
      x: 550,
      y: 320,
    },
  ];

  const relationships: ERRelationship[] = [
    {
      id: sampleId("rel"),
      name: "places",
      entity1Id: usersId,
      entity2Id: ordersId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "contains",
      entity1Id: ordersId,
      entity2Id: orderItemsId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "references",
      entity1Id: productsId,
      entity2Id: orderItemsId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "writes",
      entity1Id: usersId,
      entity2Id: reviewsId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "reviews",
      entity1Id: productsId,
      entity2Id: reviewsId,
      cardinality: "1:N",
    },
  ];

  return {
    name: "E-commerce",
    description: "Users, Products, Orders, OrderItems, Reviews",
    entities,
    relationships,
  };
}

// ── Social Media ───────────────────────────────────────────────

function buildSocialMedia(): SampleERDiagram {
  const sampleId = createIdGenerator("social");

  const usersId = sampleId("entity");
  const postsId = sampleId("entity");
  const commentsId = sampleId("entity");
  const likesId = sampleId("entity");
  const followsId = sampleId("entity");

  const entities: EREntity[] = [
    {
      id: usersId,
      name: "Users",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "user_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "username", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "email", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "bio", isPK: false, isFK: false, type: "TEXT" },
      ],
      x: 80,
      y: 160,
    },
    {
      id: postsId,
      name: "Posts",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "post_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "user_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "content", isPK: false, isFK: false, type: "TEXT" },
        { id: sampleId("attr"), name: "created_at", isPK: false, isFK: false, type: "TIMESTAMP" },
      ],
      x: 400,
      y: 60,
    },
    {
      id: commentsId,
      name: "Comments",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "comment_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "post_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "user_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "content", isPK: false, isFK: false, type: "TEXT" },
      ],
      x: 700,
      y: 60,
    },
    {
      id: likesId,
      name: "Likes",
      isWeak: true,
      attributes: [
        { id: sampleId("attr"), name: "user_id", isPK: true, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "post_id", isPK: true, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "created_at", isPK: false, isFK: false, type: "TIMESTAMP" },
      ],
      x: 400,
      y: 300,
    },
    {
      id: followsId,
      name: "Follows",
      isWeak: true,
      attributes: [
        { id: sampleId("attr"), name: "follower_id", isPK: true, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "followee_id", isPK: true, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "created_at", isPK: false, isFK: false, type: "TIMESTAMP" },
      ],
      x: 80,
      y: 400,
    },
  ];

  const relationships: ERRelationship[] = [
    {
      id: sampleId("rel"),
      name: "authors",
      entity1Id: usersId,
      entity2Id: postsId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "has",
      entity1Id: postsId,
      entity2Id: commentsId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "comments_on",
      entity1Id: usersId,
      entity2Id: commentsId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "likes",
      entity1Id: usersId,
      entity2Id: likesId,
      cardinality: "M:N",
    },
    {
      id: sampleId("rel"),
      name: "liked_on",
      entity1Id: postsId,
      entity2Id: likesId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "follows",
      entity1Id: usersId,
      entity2Id: followsId,
      cardinality: "M:N",
    },
  ];

  return {
    name: "Social Media",
    description: "Users, Posts, Comments, Likes, Follows",
    entities,
    relationships,
  };
}

// ── Library System ─────────────────────────────────────────────

function buildLibrary(): SampleERDiagram {
  const sampleId = createIdGenerator("lib");

  const booksId = sampleId("entity");
  const authorsId = sampleId("entity");
  const membersId = sampleId("entity");
  const loansId = sampleId("entity");

  const entities: EREntity[] = [
    {
      id: booksId,
      name: "Books",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "book_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "title", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "isbn", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "published_year", isPK: false, isFK: false, type: "INT" },
      ],
      x: 100,
      y: 80,
    },
    {
      id: authorsId,
      name: "Authors",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "author_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "name", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "country", isPK: false, isFK: false, type: "VARCHAR" },
      ],
      x: 500,
      y: 80,
    },
    {
      id: membersId,
      name: "Members",
      isWeak: false,
      attributes: [
        { id: sampleId("attr"), name: "member_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "name", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "email", isPK: false, isFK: false, type: "VARCHAR" },
        { id: sampleId("attr"), name: "joined_date", isPK: false, isFK: false, type: "DATE" },
      ],
      x: 100,
      y: 340,
    },
    {
      id: loansId,
      name: "Loans",
      isWeak: true,
      attributes: [
        { id: sampleId("attr"), name: "loan_id", isPK: true, isFK: false, type: "SERIAL" },
        { id: sampleId("attr"), name: "book_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "member_id", isPK: false, isFK: true, type: "INT" },
        { id: sampleId("attr"), name: "loan_date", isPK: false, isFK: false, type: "DATE" },
        { id: sampleId("attr"), name: "return_date", isPK: false, isFK: false, type: "DATE" },
      ],
      x: 500,
      y: 340,
    },
  ];

  const relationships: ERRelationship[] = [
    {
      id: sampleId("rel"),
      name: "written_by",
      entity1Id: authorsId,
      entity2Id: booksId,
      cardinality: "M:N",
    },
    {
      id: sampleId("rel"),
      name: "borrows",
      entity1Id: membersId,
      entity2Id: loansId,
      cardinality: "1:N",
    },
    {
      id: sampleId("rel"),
      name: "loaned",
      entity1Id: booksId,
      entity2Id: loansId,
      cardinality: "1:N",
    },
  ];

  return {
    name: "Library",
    description: "Books, Authors, Members, Loans",
    entities,
    relationships,
  };
}

// ── Exported Samples ───────────────────────────────────────────

export const SAMPLE_ER_DIAGRAMS: SampleERDiagram[] = [
  buildEcommerce(),
  buildSocialMedia(),
  buildLibrary(),
];
