// -----------------------------------------------------------------
// Architex -- Tree Algorithms Barrel Export
// -----------------------------------------------------------------

import type { AlgorithmConfig } from '../types';
import { UNION_FIND_CONFIG } from './union-find';
import { SEGMENT_TREE_CONFIG } from './segment-tree';
import { FENWICK_TREE_CONFIG } from './fenwick-tree';

export type { TreeNode, TreeElementState } from './types';

export { bstInsert, bstSearch, bstDelete, BST_CONFIG } from './bst';
export { avlInsert, AVL_CONFIG } from './avl';
export { rbInsert, RED_BLACK_CONFIG } from './red-black';
export { bTreeInsert, B_TREE_CONFIG } from './b-tree-algo';
export type { BTreeNode } from './b-tree-algo';
export {
  huffmanBuild,
  buildFrequencyTable,
  HUFFMAN_CONFIG,
} from './huffman';
export type { HuffmanNode, HuffmanEncodingEntry, HuffmanResult } from './huffman';
export {
  inorderTraversal,
  preorderTraversal,
  postorderTraversal,
  levelOrderTraversal,
  TRAVERSAL_CONFIG,
} from './traversals';
export {
  heapInsert,
  heapExtractMax,
  heapify,
  arrayToTree,
  HEAP_CONFIG,
} from './heap-operations';

export {
  BALANCED_BST,
  UNBALANCED_BST,
  HEAP_DEMO_ARRAY,
  SAMPLE_TREE_FOR_ALGORITHM,
} from './sample-trees';

export { layoutTree, collectNodes } from './tree-layout';
export {
  trieInsertAlgo,
  trieSearchAlgo,
  TRIE_CONFIG,
  createTrieRoot,
} from './trie-operations';
export type { TrieAlgoNode } from './trie-operations';

export {
  unionFind,
  UNION_FIND_CONFIG,
  DEFAULT_UNION_OPS,
  DEFAULT_ELEMENT_COUNT,
} from './union-find';

export {
  segmentTree,
  SEGMENT_TREE_CONFIG,
  DEFAULT_SEGMENT_INPUT,
  DEFAULT_SEGMENT_OPS,
} from './segment-tree';

export {
  fenwickTree,
  FENWICK_TREE_CONFIG,
  DEFAULT_FENWICK_INPUT,
  DEFAULT_FENWICK_OPS,
} from './fenwick-tree';

/** Catalog of all tree algorithm configurations. */
export const TREE_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'bst-operations',
    name: 'BST Insert / Search / Delete',
    category: 'tree',
    difficulty: 'beginner',
    timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)' },
    spaceComplexity: 'O(n)',
    description:
      'Imagine a phone book where you can flip to any letter instantly — that\'s a BST. Every left turn means smaller, every right turn means bigger. To find a value, just follow the signs: go left if it\'s less, right if it\'s more. Insert works the same way — walk down until you find an empty spot. Delete is trickier: replace the node with its in-order successor. Use when you need fast lookup, insert, and delete on sorted data. Used in: database indexes (MySQL B-trees evolved from BSTs), file system directories, in-memory dictionaries. Remember: "Left = smaller, right = bigger. Walk the tree."',
    complexityIntuition: 'O(log n) avg: halving the search space each step. O(n) worst if tree degenerates to a linked list.',
    realWorldApps: ['Database indexing (B-trees)', 'File system directories', 'Symbol tables in compilers'],
    interviewTips: "Know all 3 operations cold. Delete is hardest. Follow-up: 'What if the tree is skewed?' Use AVL or Red-Black.",
    whenToUse: 'Use for sorted data with fast lookup/insert/delete. For guaranteed O(log n), use AVL or Red-Black instead.',
    summary: [
      'Left = smaller, right = bigger. Walk down to find/insert.',
      'O(log n) avg, O(n) worst if tree becomes a linked list.',
      '"Phone book lookup" -- halve the search space each step.',
    ],
    commonMistakes: [
      '"BST is always O(log n)" -- only when balanced! Sorted inserts make it O(n) like a linked list.',
      '"Deleting a node with two children is simple" -- you must replace with in-order successor or predecessor.',
    ],
    pseudocode: [
      'procedure insert(root, value)',
      '  if root is null: return new Node(value)',
      '  if value < root.value:',
      '    root.left = insert(root.left, value)',
      '  else if value > root.value:',
      '    root.right = insert(root.right, value)',
      '  return root',
      'procedure search(root, value)',
      '  if root is null: return NOT FOUND',
      '  if value == root.value: return FOUND',
      '  if value < root.value: search(root.left, value)',
      '  else: search(root.right, value)',
      'procedure delete(root, value)',
      '  find node; handle leaf / one child / two children',
      '  for two children: replace with in-order successor',
    ],
  },
  {
    id: 'avl-tree',
    name: 'AVL Tree (Insert)',
    category: 'tree',
    difficulty: 'intermediate',
    prerequisites: ['bst-operations'],
    timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
    spaceComplexity: 'O(n)',
    description:
      'A BST is fast — O(log n) — but only if balanced. Insert sorted data and it degrades to a linked list: O(n). AVL Trees fix this automatically. After every insert, the tree checks balance. If one side gets too heavy (height difference > 1), it rotates nodes — like a seesaw self-correcting. Four cases: LL, RR, LR, RL rotations. Use when you need guaranteed O(log n). Prefer Red-Black Trees when inserts are frequent (fewer rotations). Used in: database indexing, memory allocators, in-memory dictionaries. Remember: "BST + auto-balance. Too heavy? Rotate."',
    complexityIntuition: 'O(log n) guaranteed: rotations keep height \u2264 1.44 log n. Never degenerates like a plain BST.',
    realWorldApps: ['Database indexing', 'Memory allocators', 'In-memory dictionaries'],
    interviewTips: "Know 4 rotation cases: LL, RR, LR, RL. Follow-up: 'AVL vs Red-Black?' AVL faster reads, RB faster writes.",
    whenToUse: 'Use when read-heavy and you need guaranteed O(log n). Prefer Red-Black for write-heavy workloads.',
    summary: [
      'BST with auto-balancing. Rotate when height diff > 1.',
      'O(log n) guaranteed for all ops. Four rotation cases.',
      '"Self-correcting seesaw" -- never degenerates to a list.',
    ],
    commonMistakes: [
      '"AVL is always better than Red-Black" -- AVL has faster reads but more rotations on inserts than RB.',
      '"There are only 2 rotation cases" -- there are 4: LL, RR, LR (double), and RL (double).',
    ],
    pseudocode: [
      'procedure avlInsert(root, value)',
      '  if root is null: return new Node(value)',
      '  if value < root: avlInsert(root.left, value)',
      '  else: avlInsert(root.right, value)',
      '  update height and balance factor',
      '  if bf > 1 and value < root.left.value: rightRotate(root)   // LL',
      '  if bf < -1 and value > root.right.value: leftRotate(root)  // RR',
      '  if bf > 1 and value > root.left.value: LR rotation',
      '  if bf < -1 and value < root.right.value: RL rotation',
      '  return root',
      'procedure rightRotate(y)',
      '  x = y.left; T2 = x.right',
      '  x.right = y; y.left = T2',
      '  update heights; return x',
      'procedure leftRotate(x)',
      '  y = x.right; T2 = y.left',
      '  y.left = x; x.right = T2',
      '  update heights; return y',
    ],
  },
  {
    id: 'tree-traversals',
    name: 'Tree Traversals',
    category: 'tree',
    difficulty: 'beginner',
    timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
    spaceComplexity: 'O(h)',
    description:
      'In what order should you visit every room in a house? Trees have four answers. Inorder (Left-Root-Right) gives sorted order for BSTs. Preorder (Root-Left-Right) copies or serializes a tree. Postorder (Left-Right-Root) safely deletes bottom-up. Level-order is BFS on a tree -- visit floor by floor. All are O(n) time, O(h) space. Pick the traversal that matches your dependency order. Used in: file system traversal (postorder to delete), expression evaluation (inorder for infix), XML/JSON serialization (preorder). Remember: "Inorder = sorted, Preorder = copy, Postorder = delete, Level = BFS."',
    summary: [
      'Inorder=sorted, Preorder=copy, Postorder=delete, Level=BFS.',
      'All O(n) time, O(h) space. Pick by dependency order.',
      '"Four ways to walk the tree" -- each serves a purpose.',
    ],
    pseudocode: [
      'procedure inorder(node)',
      '  if node is null: return',
      '  inorder(node.left)',
      '  visit(node)',
      '  inorder(node.right)',
      'procedure preorder(node)',
      '  if node is null: return',
      '  visit(node)',
      '  preorder(node.left)',
      '  preorder(node.right)',
      'procedure postorder(node)',
      '  if node is null: return',
      '  postorder(node.left)',
      '  postorder(node.right)',
      '  visit(node)',
      'procedure levelOrder(root)',
      '  Q = [root]',
      '  while Q not empty: visit(dequeue(Q))',
    ],
  },
  {
    id: 'heap-operations',
    name: 'Heap Operations',
    category: 'tree',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    description:
      'What if you always needed the maximum element instantly? A heap is like a tournament bracket -- the champion sits at the top. Insert adds at the bottom and bubbles up. Extract-max removes the root, moves the last element up, and bubbles down. Heapify builds a heap from an array in O(n) by sinking from the middle backward. Stored as an array: parent at i, children at 2i+1 and 2i+2. Used in: OS task scheduling (priority queues), Dijkstra\'s shortest path, median-finding with two heaps. Remember: "Insert = bubble up, extract = bubble down. Array = tree in disguise."',
    realWorldApps: ['OS task scheduling', "Dijkstra's algorithm (min-heap)", 'Median finding (two heaps)'],
    interviewTips: "Know: insert = bubble up, extract = bubble down. Follow-up: 'Why is heapify O(n)?' Most nodes near the bottom.",
    whenToUse: 'Use when you need fast access to min/max. For sorted order, use a BST. For top-K, use a min-heap of size K.',
    summary: [
      'Insert = bubble up, extract-max = bubble down. O(log n).',
      'Array-based tree: parent at i, children at 2i+1 and 2i+2.',
      '"Priority queue engine" -- powers Dijkstra and OS scheduling.',
    ],
    commonMistakes: [
      '"A heap is a sorted array" -- no! Only the root is guaranteed min/max. Siblings have no order.',
      '"Heapify is O(n log n)" -- build-heap is O(n) because most nodes are near the bottom.',
    ],
    pseudocode: [
      'procedure insert(heap, value)',
      '  append value to end of heap',
      '  bubbleUp(heap, lastIndex)',
      'procedure bubbleUp(heap, i)',
      '  while i > 0 and heap[i] > heap[parent(i)]',
      '    swap heap[i] and heap[parent(i)]',
      '    i = parent(i)',
      'procedure extractMax(heap)',
      '  max = heap[0]',
      '  swap heap[0] with heap[last]',
      '  remove last element',
      '  bubbleDown(heap, 0)',
      '  return max',
      'procedure bubbleDown(heap, i)',
      '  largest = i',
      '  if left(i) exists and heap[left] > heap[largest]: largest = left',
      '  if right(i) exists and heap[right] > heap[largest]: largest = right',
      '  if largest != i: swap and recurse',
      'procedure heapify(array)',
      '  for i = n/2 - 1 down to 0:',
      '    bubbleDown(array, i)',
    ],
  },
  {
    id: 'red-black-tree',
    name: 'Red-Black Tree (Insert)',
    category: 'tree',
    difficulty: 'advanced',
    prerequisites: ['bst-operations'],
    timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
    spaceComplexity: 'O(n)',
    description:
      'AVL rotates too often on frequent inserts. What if we relaxed the balance rule and just used colors? Red-Black Trees allow slight imbalance (max 2x height difference) using a simple invariant: no two red nodes in a row, equal black-depth on every path. Fixes use color flips and at most 2 rotations per insert -- fewer than AVL. Use when inserts/deletes are frequent and reads are fast enough at O(log n). Used in: Linux kernel (CFS scheduler), Java TreeMap/HashMap, C++ std::map. Remember: "Color rules + at most 2 rotations. Less strict than AVL, faster inserts."',
    pseudocode: [
      'procedure rbInsert(root, value)',
      '  insert node as red leaf (BST insert)',
      '  fixup(node)',
      'procedure fixup(z)',
      '  while z.parent is RED:',
      '    if z.parent is left child:',
      '      y = uncle (right child of grandparent)',
      '      Case 1: uncle is RED → color flip',
      '        recolor parent & uncle BLACK, grandparent RED',
      '        z = grandparent',
      '      Case 2: z is right child → left rotate parent',
      '        z = z.parent; leftRotate(z)',
      '      Case 3: z is left child → right rotate grandparent',
      '        recolor parent BLACK, grandparent RED',
      '        rightRotate(grandparent)',
      '    else: symmetric (swap left/right)',
      '  root.color = BLACK',
    ],
  },
  {
    id: 'b-tree',
    name: 'B-Tree (Insert)',
    category: 'tree',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
    spaceComplexity: 'O(n)',
    description:
      'How does a database index search billions of rows in milliseconds? With a B-Tree -- a wide, shallow tree where each node holds many keys. A BST with 1 billion entries is ~30 levels deep; a B-Tree with order 1000 is only 3 levels. Each node fits one disk page, minimizing I/O. Insert into a leaf; if it overflows, split and push the median up. Use for disk-based storage where minimizing reads matters most. Used in: MySQL InnoDB indexes, PostgreSQL, NTFS/ext4 file systems. Remember: "Wide and shallow. Fewer disk reads. Split when full, push median up."',
    pseudocode: [
      'procedure bTreeInsert(root, key, order)',
      '  if root is null: create leaf with key',
      '  find leaf node for key',
      '  insert key into leaf in sorted order',
      '  if leaf.keys.length == order:',
      '    splitChild(leaf)',
      'procedure splitChild(node)',
      '  mid = floor(keys.length / 2)',
      '  median = node.keys[mid]',
      '  leftNode = keys[0..mid-1]',
      '  rightNode = keys[mid+1..end]',
      '  push median up to parent',
      '  if parent is null: create new root with median',
      '  if parent.keys.length == order: splitChild(parent)',
    ],
  },
  {
    id: 'huffman-tree',
    name: 'Huffman Encoding Tree',
    category: 'tree',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    description:
      'How does ZIP compression know which characters need fewer bits? Huffman encoding: frequent characters get short codes, rare ones get long codes. Build a priority queue of character frequencies, repeatedly merge the two smallest into a parent node. The result is a binary tree where depth = code length. Left edges are 0, right edges are 1. No code is a prefix of another, so decoding is unambiguous. Used in: JPEG image compression, MP3 audio, gzip/deflate, HTTP/2 header compression (HPACK). Remember: "Frequent = short code. Merge two smallest, repeat. Prefix-free."',
    pseudocode: [
      'procedure huffman(text)',
      '  freq = buildFrequencyTable(text)',
      '  Q = min-priority queue of leaf nodes',
      '  while Q.size > 1:',
      '    left = Q.extractMin()',
      '    right = Q.extractMin()',
      '    merged = new Node(freq=left.freq+right.freq)',
      '    merged.left = left; merged.right = right',
      '    Q.insert(merged)',
      '  root = Q.extractMin()',
      '  assignCodes(root, "")',
      'procedure assignCodes(node, prefix)',
      '  if node is leaf: encoding[node.char] = prefix',
      '  assignCodes(node.left, prefix + "0")',
      '  assignCodes(node.right, prefix + "1")',
    ],
  },
  {
    id: 'trie-operations',
    name: 'Trie Insert / Search',
    category: 'tree',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(m)', average: 'O(m)', worst: 'O(m)' },
    spaceComplexity: 'O(n * m)',
    description:
      'How does your phone\'s keyboard predict the next word as you type? A Trie stores words character-by-character along branching paths. Type "app" and instantly find "apple", "application", "approve" -- all share the same 3-node path. Insert walks down, creating nodes for new characters. Search follows existing nodes; missing node means not found. O(m) per operation where m = word length, regardless of dictionary size. Used in: autocomplete, spell checkers, IP routing tables (longest prefix match). Remember: "One node per character, shared prefixes. O(word length) lookups."',
    realWorldApps: ['Autocomplete (search engines)', 'Spell checkers', 'IP routing (longest prefix match)'],
    interviewTips: "Know: O(m) per op, m=word length. Follow-up: 'How to find all words with prefix?' DFS from prefix node.",
    whenToUse: 'Use for prefix-based search or autocomplete. For exact-match only, a hash map is simpler and faster.',
    pseudocode: [
      'procedure trieInsert(root, word)',
      '  current = root',
      '  for each char in word do',
      '    if char not in current.children then',
      '      current.children[char] = new TrieNode()',
      '    current = current.children[char]',
      '  current.isEndOfWord = true',
      '',
      'procedure trieSearch(root, word)',
      '  current = root',
      '  for each char in word do',
      '    if char not in current.children then',
      '      return NOT FOUND',
      '    current = current.children[char]',
      '  return current.isEndOfWord',
    ],
  },
  UNION_FIND_CONFIG,
  SEGMENT_TREE_CONFIG,
  FENWICK_TREE_CONFIG,
];
