/**
 * Async Patterns Simulator
 *
 * Demonstrates Promise.all, Promise.race, Promise.allSettled, and
 * Promise.any step-by-step, showing how each combinator behaves as
 * individual promises resolve or reject over time.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AsyncPromise {
  id: string;
  state: 'pending' | 'resolved' | 'rejected';
  value?: string;
}

export interface AsyncStep {
  tick: number;
  pattern: string;
  promises: AsyncPromise[];
  output?: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Demo type
// ---------------------------------------------------------------------------

export type AsyncPatternId =
  | 'promise-all'
  | 'promise-all-reject'
  | 'promise-race'
  | 'promise-allSettled'
  | 'promise-any'
  | 'promise-any-all-reject';

export interface AsyncPatternDef {
  id: AsyncPatternId;
  title: string;
  code: string;
}

export const ASYNC_PATTERN_DEMOS: AsyncPatternDef[] = [
  {
    id: 'promise-all',
    title: 'Promise.all (success)',
    code: `Promise.all([
  fetch('/api/users'),    // 200ms
  fetch('/api/posts'),    // 400ms
  fetch('/api/comments'), // 300ms
])`,
  },
  {
    id: 'promise-all-reject',
    title: 'Promise.all (reject)',
    code: `Promise.all([
  fetch('/api/users'),    // 200ms OK
  fetch('/api/posts'),    // 150ms FAIL
  fetch('/api/comments'), // 300ms OK
])`,
  },
  {
    id: 'promise-race',
    title: 'Promise.race',
    code: `Promise.race([
  fetch('/cdn-a'),  // 300ms OK
  fetch('/cdn-b'),  // 100ms OK (wins)
  fetch('/cdn-c'),  // 250ms FAIL
])`,
  },
  {
    id: 'promise-allSettled',
    title: 'Promise.allSettled',
    code: `Promise.allSettled([
  fetch('/api/a'),  // 200ms OK
  fetch('/api/b'),  // 150ms FAIL
  fetch('/api/c'),  // 350ms OK
  fetch('/api/d'),  // 100ms FAIL
])`,
  },
  {
    id: 'promise-any',
    title: 'Promise.any (success)',
    code: `Promise.any([
  fetch('/mirror-1'),  // 300ms FAIL
  fetch('/mirror-2'),  // 200ms OK (wins)
  fetch('/mirror-3'),  // 400ms OK
])`,
  },
  {
    id: 'promise-any-all-reject',
    title: 'Promise.any (all fail)',
    code: `Promise.any([
  fetch('/mirror-1'),  // 100ms FAIL
  fetch('/mirror-2'),  // 200ms FAIL
  fetch('/mirror-3'),  // 150ms FAIL
])`,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clonePromises(promises: AsyncPromise[]): AsyncPromise[] {
  return promises.map((p) => ({ ...p }));
}

function makeStep(
  tick: number,
  pattern: string,
  promises: AsyncPromise[],
  description: string,
  output?: string,
): AsyncStep {
  return { tick, pattern, promises: clonePromises(promises), description, output };
}

// ---------------------------------------------------------------------------
// Promise.all -- all resolve -> success
// ---------------------------------------------------------------------------

export function simulatePromiseAll(): AsyncStep[] {
  const pattern = 'Promise.all';
  const steps: AsyncStep[] = [];
  const promises: AsyncPromise[] = [
    { id: 'users', state: 'pending' },
    { id: 'posts', state: 'pending' },
    { id: 'comments', state: 'pending' },
  ];

  steps.push(makeStep(0, pattern, promises,
    'Promise.all created with 3 pending promises. ALL must resolve for success.'));

  // tick 1: users resolves (200ms -- fastest)
  promises[0] = { id: 'users', state: 'resolved', value: '[User1, User2]' };
  steps.push(makeStep(1, pattern, promises,
    'fetch("/api/users") resolved with [User1, User2]. Waiting for remaining 2 promises.'));

  // tick 2: comments resolves (300ms)
  promises[2] = { id: 'comments', state: 'resolved', value: '[C1, C2, C3]' };
  steps.push(makeStep(2, pattern, promises,
    'fetch("/api/comments") resolved with [C1, C2, C3]. Waiting for 1 more promise.'));

  // tick 3: posts resolves (400ms -- slowest)
  promises[1] = { id: 'posts', state: 'resolved', value: '[Post1, Post2]' };
  steps.push(makeStep(3, pattern, promises,
    'fetch("/api/posts") resolved with [Post1, Post2]. All 3 resolved!'));

  // tick 4: final output
  steps.push(makeStep(4, pattern, promises,
    'Promise.all RESOLVED: returns array of all values in input order.',
    '[[User1, User2], [Post1, Post2], [C1, C2, C3]]'));

  return steps;
}

// ---------------------------------------------------------------------------
// Promise.all -- one rejects -> immediate failure
// ---------------------------------------------------------------------------

export function simulatePromiseAllReject(): AsyncStep[] {
  const pattern = 'Promise.all';
  const steps: AsyncStep[] = [];
  const promises: AsyncPromise[] = [
    { id: 'users', state: 'pending' },
    { id: 'posts', state: 'pending' },
    { id: 'comments', state: 'pending' },
  ];

  steps.push(makeStep(0, pattern, promises,
    'Promise.all created. If ANY promise rejects, the whole thing fails immediately.'));

  // tick 1: posts rejects first (150ms)
  promises[1] = { id: 'posts', state: 'rejected', value: '500 Server Error' };
  steps.push(makeStep(1, pattern, promises,
    'fetch("/api/posts") REJECTED with 500 Server Error! Promise.all fails immediately.'));

  // tick 2: users resolves but too late
  promises[0] = { id: 'users', state: 'resolved', value: '[User1, User2]' };
  steps.push(makeStep(2, pattern, promises,
    'fetch("/api/users") resolved, but Promise.all already rejected. Result is ignored.'));

  // tick 3: comments resolves but too late
  promises[2] = { id: 'comments', state: 'resolved', value: '[C1, C2, C3]' };
  steps.push(makeStep(3, pattern, promises,
    'fetch("/api/comments") resolved, also ignored. Remaining promises still run to completion.'));

  // tick 4: final output
  steps.push(makeStep(4, pattern, promises,
    'Promise.all REJECTED: rejects with the first rejection reason. Other results are lost.',
    'Error: 500 Server Error'));

  return steps;
}

// ---------------------------------------------------------------------------
// Promise.race -- first to resolve/reject wins
// ---------------------------------------------------------------------------

export function simulatePromiseRace(): AsyncStep[] {
  const pattern = 'Promise.race';
  const steps: AsyncStep[] = [];
  const promises: AsyncPromise[] = [
    { id: 'cdn-a', state: 'pending' },
    { id: 'cdn-b', state: 'pending' },
    { id: 'cdn-c', state: 'pending' },
  ];

  steps.push(makeStep(0, pattern, promises,
    'Promise.race created. The FIRST promise to settle (resolve OR reject) wins.'));

  // tick 1: cdn-b resolves first (100ms)
  promises[1] = { id: 'cdn-b', state: 'resolved', value: 'data-from-cdn-b' };
  steps.push(makeStep(1, pattern, promises,
    'fetch("/cdn-b") resolved first with "data-from-cdn-b"! Race is won.'));

  // tick 2: cdn-c rejects (250ms) but race already settled
  promises[2] = { id: 'cdn-c', state: 'rejected', value: 'timeout' };
  steps.push(makeStep(2, pattern, promises,
    'fetch("/cdn-c") rejected with "timeout", but race already settled. Ignored.'));

  // tick 3: cdn-a resolves (300ms) also ignored
  promises[0] = { id: 'cdn-a', state: 'resolved', value: 'data-from-cdn-a' };
  steps.push(makeStep(3, pattern, promises,
    'fetch("/cdn-a") resolved, also ignored. Only the first settlement matters.'));

  // tick 4: final output
  steps.push(makeStep(4, pattern, promises,
    'Promise.race RESOLVED: settled with the first promise to complete (cdn-b).',
    '"data-from-cdn-b"'));

  return steps;
}

// ---------------------------------------------------------------------------
// Promise.allSettled -- wait for all, report each
// ---------------------------------------------------------------------------

export function simulatePromiseAllSettled(): AsyncStep[] {
  const pattern = 'Promise.allSettled';
  const steps: AsyncStep[] = [];
  const promises: AsyncPromise[] = [
    { id: 'api-a', state: 'pending' },
    { id: 'api-b', state: 'pending' },
    { id: 'api-c', state: 'pending' },
    { id: 'api-d', state: 'pending' },
  ];

  steps.push(makeStep(0, pattern, promises,
    'Promise.allSettled created. Waits for ALL promises regardless of outcome.'));

  // tick 1: api-d rejects (100ms)
  promises[3] = { id: 'api-d', state: 'rejected', value: '404 Not Found' };
  steps.push(makeStep(1, pattern, promises,
    'fetch("/api/d") rejected with 404. allSettled does NOT fail -- keeps waiting for others.'));

  // tick 2: api-b rejects (150ms)
  promises[1] = { id: 'api-b', state: 'rejected', value: '503 Unavailable' };
  steps.push(makeStep(2, pattern, promises,
    'fetch("/api/b") rejected with 503. Still waiting -- 2 promises pending.'));

  // tick 3: api-a resolves (200ms)
  promises[0] = { id: 'api-a', state: 'resolved', value: '{ok: true}' };
  steps.push(makeStep(3, pattern, promises,
    'fetch("/api/a") resolved with {ok: true}. 1 promise still pending.'));

  // tick 4: api-c resolves (350ms)
  promises[2] = { id: 'api-c', state: 'resolved', value: '[item1, item2]' };
  steps.push(makeStep(4, pattern, promises,
    'fetch("/api/c") resolved with [item1, item2]. All 4 settled!'));

  // tick 5: final output
  steps.push(makeStep(5, pattern, promises,
    'Promise.allSettled RESOLVED: returns array of {status, value/reason} for each promise.',
    '[{fulfilled, {ok:true}}, {rejected, 503}, {fulfilled, [item1,item2]}, {rejected, 404}]'));

  return steps;
}

// ---------------------------------------------------------------------------
// Promise.any -- first success wins
// ---------------------------------------------------------------------------

export function simulatePromiseAny(): AsyncStep[] {
  const pattern = 'Promise.any';
  const steps: AsyncStep[] = [];
  const promises: AsyncPromise[] = [
    { id: 'mirror-1', state: 'pending' },
    { id: 'mirror-2', state: 'pending' },
    { id: 'mirror-3', state: 'pending' },
  ];

  steps.push(makeStep(0, pattern, promises,
    'Promise.any created. The FIRST promise to RESOLVE wins. Rejections are collected.'));

  // tick 1: mirror-2 resolves first (200ms)
  promises[1] = { id: 'mirror-2', state: 'resolved', value: 'mirror-2-data' };
  steps.push(makeStep(1, pattern, promises,
    'fetch("/mirror-2") resolved with "mirror-2-data". First success -- Promise.any wins!'));

  // tick 2: mirror-1 rejects (300ms) but any already settled
  promises[0] = { id: 'mirror-1', state: 'rejected', value: 'ECONNREFUSED' };
  steps.push(makeStep(2, pattern, promises,
    'fetch("/mirror-1") rejected, but Promise.any already resolved. Rejection ignored.'));

  // tick 3: mirror-3 resolves (400ms) also ignored
  promises[2] = { id: 'mirror-3', state: 'resolved', value: 'mirror-3-data' };
  steps.push(makeStep(3, pattern, promises,
    'fetch("/mirror-3") resolved, also ignored. Only the first fulfillment matters.'));

  // tick 4: final output
  steps.push(makeStep(4, pattern, promises,
    'Promise.any RESOLVED: settled with the first fulfilled promise (mirror-2).',
    '"mirror-2-data"'));

  return steps;
}

// ---------------------------------------------------------------------------
// Promise.any -- all reject -> AggregateError
// ---------------------------------------------------------------------------

export function simulatePromiseAnyAllReject(): AsyncStep[] {
  const pattern = 'Promise.any';
  const steps: AsyncStep[] = [];
  const promises: AsyncPromise[] = [
    { id: 'mirror-1', state: 'pending' },
    { id: 'mirror-2', state: 'pending' },
    { id: 'mirror-3', state: 'pending' },
  ];

  steps.push(makeStep(0, pattern, promises,
    'Promise.any created. If ALL reject, it throws an AggregateError.'));

  // tick 1: mirror-1 rejects (100ms)
  promises[0] = { id: 'mirror-1', state: 'rejected', value: 'ECONNREFUSED' };
  steps.push(makeStep(1, pattern, promises,
    'fetch("/mirror-1") rejected. Promise.any still hoping for a success...'));

  // tick 2: mirror-3 rejects (150ms)
  promises[2] = { id: 'mirror-3', state: 'rejected', value: 'ETIMEDOUT' };
  steps.push(makeStep(2, pattern, promises,
    'fetch("/mirror-3") rejected. 1 promise remaining -- last chance.'));

  // tick 3: mirror-2 rejects (200ms)
  promises[1] = { id: 'mirror-2', state: 'rejected', value: '500 Error' };
  steps.push(makeStep(3, pattern, promises,
    'fetch("/mirror-2") rejected. All 3 promises failed! No success found.'));

  // tick 4: final output
  steps.push(makeStep(4, pattern, promises,
    'Promise.any REJECTED: AggregateError wrapping all individual rejection reasons.',
    'AggregateError: [ECONNREFUSED, 500 Error, ETIMEDOUT]'));

  return steps;
}

// ---------------------------------------------------------------------------
// Main entry -- select a demo by ID
// ---------------------------------------------------------------------------

export function simulateAsyncPattern(id: AsyncPatternId): AsyncStep[] {
  switch (id) {
    case 'promise-all':
      return simulatePromiseAll();
    case 'promise-all-reject':
      return simulatePromiseAllReject();
    case 'promise-race':
      return simulatePromiseRace();
    case 'promise-allSettled':
      return simulatePromiseAllSettled();
    case 'promise-any':
      return simulatePromiseAny();
    case 'promise-any-all-reject':
      return simulatePromiseAnyAllReject();
  }
}
