// -----------------------------------------------------------------
// Architex -- Backtracking Algorithms Barrel Export
// -----------------------------------------------------------------

import type { AlgorithmConfig } from '../types';

export { solveNQueens, N_QUEENS_CONFIG } from './n-queens';
export type { QueenPlacement } from './n-queens';

export { solveSudoku, SUDOKU_CONFIG, SAMPLE_SUDOKU } from './sudoku';

export { solveKnightsTour, KNIGHTS_TOUR_CONFIG } from './knights-tour';
export type { KnightPosition } from './knights-tour';

export {
  generateSubsets,
  SUBSET_GENERATION_CONFIG,
  DEFAULT_SUBSET_SET,
} from './subset-generation';
export type { SubsetStep } from './subset-generation';

/** Catalog of all backtracking algorithm configurations. */
export const BACKTRACKING_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'n-queens',
    name: 'N-Queens',
    category: 'backtracking',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(N!)', average: 'O(N!)', worst: 'O(N!)' },
    spaceComplexity: 'O(N)',
    description:
      'Can you place 8 queens on a chess board so none attack each other? No two in the same row, column, or diagonal. With 4 billion arrangements, brute force is hopeless. Backtracking makes it elegant: place a queen in row 1, try row 2. No column works? Backtrack and try the next. This "try, check, backtrack" prunes vast branches — ~15,000 checks instead of billions. Use for constraint satisfaction: scheduling, Sudoku, map coloring. Used in: Sudoku solvers, compiler register allocation, constraint programming. Remember: "Try, check, backtrack. Don\'t explore what can\'t work."',
    pseudocode: [
      'procedure solveNQueens(row, board)',
      '  if row == N: record solution; return true',
      '  for col = 0 to N-1 do',
      '    if isSafe(row, col, board) then',
      '      board[row] = col   // place queen',
      '      if solveNQueens(row+1, board): return true',
      '      board[row] = -1    // backtrack',
      '  return false            // no valid col',
    ],
  },
  {
    id: 'sudoku',
    name: 'Sudoku Solver',
    category: 'backtracking',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(1)', average: 'O(9^m)', worst: 'O(9^81)' },
    spaceComplexity: 'O(81)',
    description:
      '9 rows, 9 columns, 9 boxes -- each must contain digits 1-9 exactly once. Can backtracking solve any valid puzzle? Yes. Find an empty cell, try digits 1-9. For each digit, check three constraints: unique in its row, column, and 3x3 box. Valid? Place it and recurse to the next empty cell. Stuck? Backtrack -- erase and try the next digit. Constraint propagation prunes early, making it fast in practice despite O(9^m) worst case. Used in: puzzle solvers, constraint satisfaction engines, SAT solver heuristics. Remember: "Find empty, try 1-9, check row/col/box. Stuck? Erase and backtrack."',
    pseudocode: [
      'procedure solveSudoku(board)',
      '  cell = findEmpty(board)',
      '  if cell is null: return true  // solved',
      '  for num = 1 to 9 do',
      '    if isValid(cell, num, board) then',
      '      board[cell] = num',
      '      if solveSudoku(board): return true',
      '      board[cell] = 0  // backtrack',
      '  return false           // no valid number',
    ],
  },
  {
    id: 'knights-tour',
    name: "Knight's Tour",
    category: 'backtracking',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(N^2)', average: 'O(8^(N^2))', worst: 'O(8^(N^2))' },
    spaceComplexity: 'O(N^2)',
    description:
      'Can a chess knight visit every square on the board exactly once? A knight has up to 8 L-shaped moves. Naive backtracking tries all 8 at each of N^2 squares -- astronomically slow. Warnsdorff\'s heuristic transforms it: always move to the square with the fewest onward options. This "most constrained first" strategy finds a tour with almost zero backtracking, even on large boards. Used in: puzzle generation, Hamiltonian path research, graph traversal algorithm benchmarks. Remember: "8 moves per square, N^2 squares. Warnsdorff: pick the most constrained next."',
    pseudocode: [
      'procedure knightsTour(board, row, col, moveNum)',
      '  board[row][col] = moveNum',
      '  if moveNum == N*N: return true  // all visited',
      '  moves = getValidMoves(row, col)',
      '  sort moves by Warnsdorff degree (ascending)',
      '  for each (nr, nc) in moves do',
      '    if knightsTour(board, nr, nc, moveNum+1): return true',
      '  board[row][col] = 0  // backtrack',
      '  return false',
    ],
  },
  {
    id: 'subset-generation',
    name: 'Subset Generation',
    category: 'backtracking',
    difficulty: 'beginner',
    timeComplexity: { best: 'O(2^N)', average: 'O(2^N)', worst: 'O(2^N)' },
    spaceComplexity: 'O(N)',
    description:
      'Given a set of N items, how do you generate ALL 2^N possible subsets? At each element, make a binary choice: include it or skip it. This builds a decision tree that branches at every element -- left = include, right = exclude. Each leaf is a complete subset. The recursion is elegant: add the element, recurse, then remove it (backtrack) and recurse again. Exactly 2^N subsets, no duplicates. Used in: power set computation, combinatorial testing, feature selection in ML, generating test cases. Remember: "Include or exclude at each step. 2 choices per element = 2^N subsets."',
    pseudocode: [
      'procedure generateSubsets(index, current, set)',
      '  if index == |set|:',
      '    record current as a complete subset',
      '    return',
      '  // Branch 1: include set[index]',
      '  current.push(set[index])',
      '  generateSubsets(index+1, current, set)',
      '  // Branch 2: exclude set[index] (backtrack)',
      '  current.pop()',
      '  generateSubsets(index+1, current, set)',
    ],
  },
];
