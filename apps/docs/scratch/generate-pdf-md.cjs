const fs = require('fs');
const path = require('path');

const out = [];
const order = [
  'introduction.md',
  'authentication.md',
  'quickstart.md',
  'sms/send.md',
  'sms/bulk.md',
  'sms/scheduled.md',
  'sms/excel-import.md',
  'contacts/overview.md',
  'contacts/groups.md',
  'campaigns/overview.md',
  'webhooks/dlr.md',
  'reference/api.md',
  'reference/errors.md',
  'reference/rate-limits.md'
];

out.push('# SMSGate API Documentation\n\n');

order.forEach(f => {
  const p = path.join('apps/docs/src/content/docs', f);
  if(fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    
    // Extract title from frontmatter
    let title = f.split('.')[0].split('/').pop().toUpperCase();
    const match = c.match(/title:\s*(.+)/);
    if (match) title = match[1];

    c = c.replace(/---[\s\S]*?---/, '');
    out.push('# ' + title + '\n\n' + c.trim());
  }
});

fs.writeFileSync('apps/docs/public/smsgate-docs.md', out.join('\n\n---\n\n'));
