const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

const migrate = async () => {
    try {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running migration...');
        // SQLite doesn't support multiple statements in one call usually via some drivers, 
        // but sqlite3's exec() does. Our wrapper uses run/all. 
        // simpler to just split by ;

        const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (const statement of statements) {
            await query(statement);
        }

        console.log('Migration completed successfully.');
        // Keep process alive for a moment to ensure async writes if any, simpler to just exit
        setTimeout(() => process.exit(0), 500);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
