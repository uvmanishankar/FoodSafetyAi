const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

module.exports = {
    query: (text, params = []) => {
        return new Promise((resolve, reject) => {
            // Very basic translation from PG style query to SQLite
            // Note: SQLite uses ? for params, PG uses $1, $2
            // For this MVP, we will try to use a wrapper or just write valid SQLite in services

            // Simple loop to replace $1, $2 with ?
            let sql = text;
            let i = 1;
            while (sql.includes(`$${i}`)) {
                sql = sql.replace(`$${i}`, '?');
                i++;
            }

            if (text.trim().toLowerCase().startsWith('select')) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows });
                });
            } else {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
                });
            }
        });
    }
};
