const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function runTest() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Kumuisha#123',
    database: 'smsgate'
  });

  const groupId = uuidv4();
  const accountId = 'test-account-id';

  try {
    console.log('\\n--- Setting up Test Data ---');
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Colombo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const parts = {};
    for (const part of formatter.formatToParts(new Date())) {
      parts[part.type] = part.value;
    }
    
    const today = parts.year + '-' + parts.month + '-' + parts.day;
    
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lwYear = lastWeekDate.getFullYear();
    const lwMonth = String(lastWeekDate.getMonth() + 1).padStart(2, '0');
    const lwDay = String(lastWeekDate.getDate()).padStart(2, '0');
    const lastWeek = lwYear + '-' + lwMonth + '-' + lwDay;
    
    const lastMonth = '2022-01-' + parts.day;
    const lastYear = '2015-' + parts.month + '-' + parts.day;
    const randomDate = '2023-05-12';

    console.log('Today (Anchor Date): ' + today);

    const testContacts = [
      { id: uuidv4(), groupId, eventDate: today, desc: 'Exact Today' },
      { id: uuidv4(), groupId, eventDate: lastWeek, desc: 'Exactly 1 Week Ago' },
      { id: uuidv4(), groupId, eventDate: lastMonth, desc: 'Same Day of Month, Old Year/Month' },
      { id: uuidv4(), groupId, eventDate: lastYear, desc: 'Same Month & Day, Old Year' },
      { id: uuidv4(), groupId, eventDate: randomDate, desc: 'Random Date' },
    ];

    for (const c of testContacts) {
      await conn.query(
        'INSERT INTO contacts (id, account_id, group_id, phone, first_name, event_date) VALUES (?, ?, ?, ?, ?, ?)',
        [c.id, accountId, groupId, '+94770000000', c.desc, c.eventDate]
      );
      console.log('Inserted: ' + c.desc + ' -> ' + c.eventDate);
    }

    console.log('\\n--- Running Tests ---');
    const mmdd = parts.month + '-' + parts.day;
    const dd = parts.day;

    const queries = {
      Daily: 'SELECT * FROM contacts WHERE group_id = ?',
      Weekly: 'SELECT * FROM contacts WHERE group_id = ? AND DAYOFWEEK(event_date) = DAYOFWEEK(?)',
      Monthly: 'SELECT * FROM contacts WHERE group_id = ? AND event_date LIKE ?',
      Yearly: 'SELECT * FROM contacts WHERE group_id = ? AND event_date LIKE ?'
    };

    const params = {
      Daily: [groupId],
      Weekly: [groupId, today],
      Monthly: [groupId, '%-' + dd],
      Yearly: [groupId, '%' + mmdd]
    };

    for (const [freq, query] of Object.entries(queries)) {
      const [rows] = await conn.query(query, params[freq]);
      console.log('\\n[TEST: ' + freq + ']');
      console.log('Matches found: ' + rows.length);
      rows.forEach(r => console.log('  -> ' + r.first_name + ' (' + r.event_date + ')'));
    }

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    console.log('\\n--- Cleaning up ---');
    await conn.query('DELETE FROM contacts WHERE group_id = ?', [groupId]);
    await conn.end();
    console.log('Done.');
  }
}

runTest();
