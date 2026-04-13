const fs = require('fs');
const path = require('path');

const tasksPath = path.join(__dirname, 'tasks.json');
const board = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

// Tasks to mark as done
const doneIds = process.argv.slice(2);

let marked = 0;
board.tasks.forEach(t => {
  if (doneIds.includes(t.id) && t.status !== 'done') {
    t.status = 'done';
    t.updatedAt = new Date().toISOString();
    marked++;
    console.log(`✅ ${t.id}: ${t.title}`);
  }
});

// Update epic counts
board.epics.forEach(e => {
  e.taskCount = board.tasks.filter(t => t.epic === e.id).length;
  e.completedCount = board.tasks.filter(t => t.epic === e.id && t.status === 'done').length;
});

board.meta.generatedAt = new Date().toISOString();
fs.writeFileSync(tasksPath, JSON.stringify(board, null, 2));

const done = board.tasks.filter(t => t.status === 'done').length;
const total = board.tasks.length;
console.log(`\nMarked ${marked} tasks done. Total: ${done}/${total} (${Math.round(done/total*100)}%)`);
