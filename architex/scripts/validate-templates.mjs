#!/usr/bin/env node
/**
 * Template corpus validator.
 *
 * For every JSON file in templates/system-design/:
 *   1. Parse (hard fail on syntax errors).
 *   2. nodes/edges must be non-empty arrays with unique string ids.
 *   3. If a `simulation` block exists (see src/lib/templates/types.ts):
 *      - simulation.chaosScenarios: non-empty array; every scenario's
 *        targetNodes entries must reference existing node ids; faultType
 *        and severity must be in-range.
 *      - simulation.expectedIssues: present, non-empty, shape-conformant
 *        (likelihood/impact 1-5 integers, affectedNodes reference nodes).
 *      - simulation.slaDefinitions: present, non-empty, shape-conformant
 *        (target is a finite non-negative number — zero-tolerance SLAs allowed).
 *      - simulation.performanceTargets: present, shape-conformant
 *        (all numeric fields finite; positive where required).
 *
 * Prints a per-file PASS/FAIL table plus summary counts.
 * Exits 1 if any file fails.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'templates',
  'system-design',
);

const FAULT_TYPES = new Set([
  'latency',
  'error',
  'crash',
  'partition',
  'resource-exhaustion',
  'data-corruption',
]);

const TRAFFIC_PROFILES = new Set(['steady', 'bursty', 'diurnal', 'event-driven']);

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isPositive = (v) => isFiniteNum(v) && v > 0;
const isNonNegative = (v) => isFiniteNum(v) && v >= 0;
const isScale1to5 = (v) => Number.isInteger(v) && v >= 1 && v <= 5;

/** @returns {string[]} list of error messages (empty = pass) */
function validateTemplate(raw, fileName) {
  const errors = [];
  let tpl;
  try {
    tpl = JSON.parse(raw);
  } catch (err) {
    return [`JSON syntax error: ${err.message}`];
  }

  // ── nodes / edges ────────────────────────────────────────────
  const nodeIds = new Set();
  if (!Array.isArray(tpl.nodes) || tpl.nodes.length === 0) {
    errors.push('nodes: missing, not an array, or empty');
  } else {
    tpl.nodes.forEach((n, i) => {
      if (!isStr(n?.id)) {
        errors.push(`nodes[${i}]: missing string id`);
        return;
      }
      if (nodeIds.has(n.id)) errors.push(`nodes: duplicate id "${n.id}"`);
      nodeIds.add(n.id);
    });
  }

  const edgeIds = new Set();
  if (!Array.isArray(tpl.edges) || tpl.edges.length === 0) {
    errors.push('edges: missing, not an array, or empty');
  } else {
    tpl.edges.forEach((e, i) => {
      if (!isStr(e?.id)) {
        errors.push(`edges[${i}]: missing string id`);
        return;
      }
      if (edgeIds.has(e.id)) errors.push(`edges: duplicate id "${e.id}"`);
      edgeIds.add(e.id);
    });
  }

  // ── simulation block (optional) ──────────────────────────────
  const sim = tpl.simulation;
  if (sim == null) return errors;
  if (typeof sim !== 'object' || Array.isArray(sim)) {
    errors.push('simulation: not an object');
    return errors;
  }

  // chaosScenarios
  if (!Array.isArray(sim.chaosScenarios) || sim.chaosScenarios.length === 0) {
    errors.push('simulation.chaosScenarios: missing or empty array');
  } else {
    sim.chaosScenarios.forEach((cs, i) => {
      const at = `chaosScenarios[${i}]`;
      if (!isStr(cs?.id)) errors.push(`${at}: missing string id`);
      if (!isStr(cs?.name)) errors.push(`${at}: missing string name`);
      if (!isStr(cs?.description)) errors.push(`${at}: missing string description`);
      if (!Array.isArray(cs?.targetNodes) || cs.targetNodes.length === 0) {
        errors.push(`${at}: targetNodes missing or empty`);
      } else {
        cs.targetNodes.forEach((t) => {
          if (!nodeIds.has(t)) errors.push(`${at}: targetNodes references unknown node "${t}"`);
        });
      }
      if (!FAULT_TYPES.has(cs?.faultType)) errors.push(`${at}: invalid faultType "${cs?.faultType}"`);
      if (!isScale1to5(cs?.severity)) errors.push(`${at}: severity must be integer 1-5 (got ${cs?.severity})`);
      if (!isStr(cs?.expectedBehavior)) errors.push(`${at}: missing string expectedBehavior`);
      if (!Array.isArray(cs?.mitigationSteps) || cs.mitigationSteps.some((s) => !isStr(s))) {
        errors.push(`${at}: mitigationSteps must be a string array`);
      }
    });
  }

  // expectedIssues
  if (!Array.isArray(sim.expectedIssues) || sim.expectedIssues.length === 0) {
    errors.push('simulation.expectedIssues: missing or empty array');
  } else {
    sim.expectedIssues.forEach((ei, i) => {
      const at = `expectedIssues[${i}]`;
      if (!isStr(ei?.id)) errors.push(`${at}: missing string id`);
      if (!isStr(ei?.title)) errors.push(`${at}: missing string title`);
      if (!isStr(ei?.description)) errors.push(`${at}: missing string description`);
      if (!Array.isArray(ei?.affectedNodes)) {
        errors.push(`${at}: affectedNodes must be an array`);
      } else {
        ei.affectedNodes.forEach((t) => {
          if (!nodeIds.has(t)) errors.push(`${at}: affectedNodes references unknown node "${t}"`);
        });
      }
      if (!isScale1to5(ei?.likelihood)) errors.push(`${at}: likelihood must be integer 1-5 (got ${ei?.likelihood})`);
      if (!isScale1to5(ei?.impact)) errors.push(`${at}: impact must be integer 1-5 (got ${ei?.impact})`);
      if (!isStr(ei?.mitigation)) errors.push(`${at}: missing string mitigation`);
    });
  }

  // slaDefinitions
  if (!Array.isArray(sim.slaDefinitions) || sim.slaDefinitions.length === 0) {
    errors.push('simulation.slaDefinitions: missing or empty array');
  } else {
    sim.slaDefinitions.forEach((sla, i) => {
      const at = `slaDefinitions[${i}]`;
      if (!isStr(sla?.name)) errors.push(`${at}: missing string name`);
      if (!isStr(sla?.metric)) errors.push(`${at}: missing string metric`);
      // >= 0, not > 0: zero-tolerance SLAs (e.g. "0 oversold orders",
      // "0 duplicate charges per million") are intentional and valid.
      if (!isNonNegative(sla?.target)) errors.push(`${at}: target must be a finite non-negative number (got ${sla?.target})`);
      if (!isStr(sla?.unit)) errors.push(`${at}: missing string unit`);
      if (!isStr(sla?.penalty)) errors.push(`${at}: missing string penalty`);
    });
  }

  // performanceTargets
  const pt = sim.performanceTargets;
  if (pt == null || typeof pt !== 'object' || Array.isArray(pt)) {
    errors.push('simulation.performanceTargets: missing or not an object');
  } else {
    const at = 'performanceTargets';
    if (!isPositive(pt.defaultRps)) errors.push(`${at}.defaultRps: must be finite positive (got ${pt.defaultRps})`);
    if (!TRAFFIC_PROFILES.has(pt.trafficProfile)) errors.push(`${at}.trafficProfile: invalid "${pt.trafficProfile}"`);
    if (!isPositive(pt.p50LatencyMs)) errors.push(`${at}.p50LatencyMs: must be finite positive (got ${pt.p50LatencyMs})`);
    if (!isPositive(pt.p99LatencyMs)) errors.push(`${at}.p99LatencyMs: must be finite positive (got ${pt.p99LatencyMs})`);
    if (!isPositive(pt.availabilityTarget) || pt.availabilityTarget > 100) {
      errors.push(`${at}.availabilityTarget: must be finite, >0 and <=100 (got ${pt.availabilityTarget})`);
    }
    if (!isNonNegative(pt.maxErrorRatePercent)) {
      errors.push(`${at}.maxErrorRatePercent: must be finite and >=0 (got ${pt.maxErrorRatePercent})`);
    }
    if (!isPositive(pt.throughputRps)) errors.push(`${at}.throughputRps: must be finite positive (got ${pt.throughputRps})`);
  }

  return errors;
}

// ── run ────────────────────────────────────────────────────────
const files = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json')).sort();
const results = files.map((file) => {
  const raw = readFileSync(join(TEMPLATES_DIR, file), 'utf8');
  const errors = validateTemplate(raw, file);
  const hasSim = (() => {
    try { return JSON.parse(raw).simulation != null; } catch { return false; }
  })();
  return { file, errors, hasSim };
});

const nameWidth = Math.max(...results.map((r) => r.file.length), 4);
console.log(`${'FILE'.padEnd(nameWidth)}  SIM  RESULT`);
console.log('-'.repeat(nameWidth + 14));
for (const { file, errors, hasSim } of results) {
  const status = errors.length === 0 ? 'PASS' : 'FAIL';
  console.log(`${file.padEnd(nameWidth)}  ${hasSim ? 'yes' : ' - '}  ${status}`);
  for (const err of errors) console.log(`${' '.repeat(nameWidth + 7)}  - ${err}`);
}

const passed = results.filter((r) => r.errors.length === 0).length;
const failed = results.length - passed;
const withSim = results.filter((r) => r.hasSim).length;
console.log('-'.repeat(nameWidth + 14));
console.log(
  `Total: ${results.length}  |  PASS: ${passed}  |  FAIL: ${failed}  |  with simulation: ${withSim}`,
);

process.exit(failed > 0 ? 1 : 0);
