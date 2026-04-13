/**
 * PaperDraw main.dart.js Structure Extractor
 * Parses the compiled Dart JS and extracts logical sections into separate files
 */
const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, 'main.dart.js'), 'utf-8');
const outDir = path.join(__dirname, 'extracted');
fs.mkdirSync(outDir, { recursive: true });

console.log('Total code size: ' + code.length + ' chars, ' + code.split('\n').length + ' lines');

// 1. Extract all string constants (the readable business data)
console.log('\n=== Extracting string constants ===');
const strings = {};
const strRegex = /"([^"]{20,500})"/g;
let m;
while ((m = strRegex.exec(code)) !== null) {
  const s = m[1];
  if (s.indexOf('\\n') === -1 && s.indexOf('function') === -1 && s.indexOf('return ') === -1 && s.indexOf('prototype') === -1) {
    if (!strings[s]) strings[s] = 0;
    strings[s]++;
  }
}
const sortedStrings = Object.entries(strings).sort((a, b) => b[1] - a[1]);
fs.writeFileSync(path.join(outDir, 'all-strings.txt'), sortedStrings.map(function(x) { return '[' + x[1] + 'x] ' + x[0]; }).join('\n'));
console.log('  Found ' + sortedStrings.length + ' unique strings');

// 2. Extract component definitions
console.log('\n=== Extracting component definitions ===');
const compRegex = /new A\.at\("([^"]+)","([^"]+)",([^,]+),(\d+),"([^"]+)"\)/g;
const components = [];
while ((m = compRegex.exec(code)) !== null) {
  components.push({ name: m[1], description: m[2], ordinal: parseInt(m[4]), id: m[5] });
}
components.sort((a, b) => a.ordinal - b.ordinal);
fs.writeFileSync(path.join(outDir, 'components-registry.json'), JSON.stringify(components, null, 2));
console.log('  Found ' + components.length + ' component registrations');

// 3. Extract prototype classes
console.log('\n=== Extracting class prototypes ===');
const protoRegex = /A\.(\w+)\.prototype=\{/g;
const classNames = [];
while ((m = protoRegex.exec(code)) !== null) {
  classNames.push({ name: m[1], offset: m.index });
}
console.log('  Found ' + classNames.length + ' class prototypes');

const classSizes = classNames.map(function(cls, i) {
  const nextOffset = i < classNames.length - 1 ? classNames[i + 1].offset : code.length;
  return Object.assign({}, cls, { size: nextOffset - cls.offset });
}).sort((a, b) => b.size - a.size);

fs.writeFileSync(path.join(outDir, 'class-sizes.json'), JSON.stringify(classSizes.slice(0, 200).map(function(c) {
  return { name: c.name, size: c.size, sizeKB: (c.size / 1024).toFixed(1) + 'KB' };
}), null, 2));
console.log('  Top 10 largest classes:');
classSizes.slice(0, 10).forEach(function(c) { console.log('    ' + c.name + ': ' + (c.size/1024).toFixed(1) + 'KB'); });

// 4. Extract top 50 classes as files
console.log('\n=== Extracting top 50 classes as files ===');
const classesDir = path.join(outDir, 'classes');
fs.mkdirSync(classesDir, { recursive: true });
classSizes.slice(0, 50).forEach(function(cls) {
  const end = cls.offset + cls.size;
  const classCode = code.substring(cls.offset, Math.min(end, cls.offset + 100000));
  fs.writeFileSync(path.join(classesDir, cls.name + '.js'), classCode);
});
console.log('  Wrote 50 class files');

// 5. Extract issue codes
console.log('\n=== Extracting issue codes ===');
const issueCodeRegex = /"((?:JOB|BATCH|EXT|INFRA|NLB|ALERT|APP|CACHE|DB|LB|NET|WAF|CDN|DNS|SERVERLESS|QUEUE|STREAM)-\d+)"/g;
const issueCodes = new Set();
while ((m = issueCodeRegex.exec(code)) !== null) issueCodes.add(m[1]);
fs.writeFileSync(path.join(outDir, 'issue-codes.txt'), Array.from(issueCodes).sort().join('\n'));
console.log('  Found ' + issueCodes.size + ' issue codes');

// 6. Extract simulation engine
console.log('\n=== Extracting simulation engine ===');
const simDir = path.join(outDir, 'simulation-engine');
fs.mkdirSync(simDir, { recursive: true });

const tickIdx = code.indexOf('"cpuThrottleTicks"');
if (tickIdx > -1) {
  let funcStart = tickIdx;
  for (let i = tickIdx; i > tickIdx - 5000; i--) {
    if (code.substring(i, i + 8) === 'function') { funcStart = i; break; }
  }
  const tickFunc = code.substring(funcStart, tickIdx + 10000);
  fs.writeFileSync(path.join(simDir, 'tick-engine.js'), tickFunc);
  console.log('  Extracted tick engine: ' + (tickFunc.length/1024).toFixed(1) + 'KB');
}

const costIdx = code.indexOf('"monthly_cost",s*24*30');
if (costIdx > -1) {
  fs.writeFileSync(path.join(simDir, 'cost-calculation.js'), code.substring(costIdx - 2000, costIdx + 2000));
  console.log('  Extracted cost calculation');
}

const cascadeIdx = code.indexOf('"cascadeScore"');
if (cascadeIdx > -1) {
  fs.writeFileSync(path.join(simDir, 'cascade-detection.js'), code.substring(cascadeIdx - 2000, cascadeIdx + 3000));
  console.log('  Extracted cascade detection');
}

// 7. Extract Supabase service
console.log('\n=== Extracting Supabase service ===');
const supaDir = path.join(outDir, 'supabase-service');
fs.mkdirSync(supaDir, { recursive: true });

const specIdx = code.indexOf('specialization_profile_overlays');
if (specIdx > -1) {
  fs.writeFileSync(path.join(supaDir, 'specialization-query.js'), code.substring(specIdx - 3000, specIdx + 3000));
  console.log('  Extracted specialization query');
}

const profileIdx = code.indexOf('"profileSignature"');
if (profileIdx > -1) {
  fs.writeFileSync(path.join(supaDir, 'profile-parser.js'), code.substring(profileIdx - 2000, profileIdx + 3000));
  console.log('  Extracted profile parser');
}

// 8. Extract constants
console.log('\n=== Extracting constants ===');
const constDir = path.join(outDir, 'constants');
fs.mkdirSync(constDir, { recursive: true });

// Extract component constant block (B.xxx = new A.at(...))
const compConstRegex = /B\.(\w+)=new A\.at\("[^"]*","[^"]*",[^)]+\)/g;
const compConstants = [];
while ((m = compConstRegex.exec(code)) !== null) {
  compConstants.push(m[0]);
}
fs.writeFileSync(path.join(constDir, 'component-constants.js'), compConstants.join('\n'));
console.log('  Extracted ' + compConstants.length + ' component constants');

// Extract all B.xxx constant assignments
const allConstRegex = /B\.(\w+)=new A\.(\w+)\(/g;
const constCounts = {};
while ((m = allConstRegex.exec(code)) !== null) {
  const cls = m[2];
  if (!constCounts[cls]) constCounts[cls] = 0;
  constCounts[cls]++;
}
fs.writeFileSync(path.join(constDir, 'constant-classes.json'), JSON.stringify(
  Object.entries(constCounts).sort((a, b) => b[1] - a[1]).slice(0, 50).map(function(x) {
    return { class: x[0], instances: x[1] };
  }), null, 2));

// 9. Structure summary
const summary = {
  app: { name: 'system_design_simulator', version: '1.0.0', framework: 'Flutter Web (dart2js)' },
  stats: {
    totalLines: code.split('\n').length,
    totalChars: code.length,
    classes: classNames.length,
    uniqueStrings: sortedStrings.length,
    components: components.length,
    issueCodes: issueCodes.size,
    topClassSizeKB: (classSizes[0].size / 1024).toFixed(1)
  }
};
fs.writeFileSync(path.join(outDir, 'STRUCTURE.json'), JSON.stringify(summary, null, 2));

console.log('\n=== DONE ===');
