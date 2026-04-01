const fs = require('fs');
const p = require('path');

function search(dir, depth) {
  if (depth > 2) return;
  try {
    const items = fs.readdirSync(dir);
    for (const i of items) {
      const fp = p.join(dir, i);
      const st = fs.statSync(fp);
      if (st.isFile()) {
        if ((i.endsWith('.mjs') || i.endsWith('.js')) && st.size < 500000) {
          const c = fs.readFileSync(fp, 'utf8');
          if (c.includes('vader')) {
            console.log('FOUND:', fp);
          }
        }
      }
      if (st.isDirectory() && !i.startsWith('.')) {
        search(fp, depth + 1);
      }
    }
  } catch (e) {}
}

search('node_modules', 0);
console.log('DONE');
