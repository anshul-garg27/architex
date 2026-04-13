const fs = require('fs');
const path = require('path');

const dir = __dirname;
const board = JSON.parse(fs.readFileSync(path.join(dir, 'tasks.json'), 'utf8'));
const missing = JSON.parse(fs.readFileSync(path.join(dir, 'batch-missing.json'), 'utf8'));

const existingIds = new Set(board.tasks.map(t => t.id));
let added = 0;

missing.forEach(t => {
  if (existingIds.has(t.id)) return;
  board.tasks.push(t);
  existingIds.add(t.id);
  added++;
});

// Update epic counts
board.epics.forEach(e => {
  e.taskCount = board.tasks.filter(t => t.epic === e.id).length;
  e.completedCount = board.tasks.filter(t => t.epic === e.id && t.status === 'done').length;
});

board.meta.generatedAt = new Date().toISOString();

fs.writeFileSync(path.join(dir, 'tasks.json'), JSON.stringify(board, null, 2));

const sizeKB = (fs.statSync(path.join(dir, 'tasks.json')).size / 1024).toFixed(0);
console.log(`Added ${added} missing tasks`);
console.log(`New total: ${board.tasks.length} tasks`);
console.log(`Size: ${sizeKB}KB`);

// Final stats
const byPriority = {};
const byStatus = {};
board.tasks.forEach(t => {
  byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  byStatus[t.status] = (byStatus[t.status] || 0) + 1;
});
console.log('By priority:', JSON.stringify(byPriority));
console.log('By status:', JSON.stringify(byStatus));
console.log('Epics:', board.epics.length);
