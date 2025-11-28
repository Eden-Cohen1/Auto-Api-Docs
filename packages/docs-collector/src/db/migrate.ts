import * as fs from 'fs';
import * as path from 'path';
import { getPool, closePool } from './connection';

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log('');
  console.log('================================================');
  console.log('  Running Database Migrations');
  console.log('================================================');
  console.log('');

  try {
    const pool = await getPool();

    // Get migration files
    const migrationsDir = path.join(__dirname, '../../../..', 'database', 'migrations');

    const migrationFiles = [
      '001-create-raw-data-schema.sql',
      '002-create-published-docs-schema.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);

      if (!fs.existsSync(filePath)) {
        console.error(`✗ Migration file not found: ${file}`);
        continue;
      }

      console.log(`Running: ${file}`);

      const sql = fs.readFileSync(filePath, 'utf8');

      // Split by GO statements (SQL Server batch separator)
      const batches = sql.split(/^\s*GO\s*$/gim);

      for (const batch of batches) {
        const trimmed = batch.trim();
        if (trimmed) {
          await pool.request().query(trimmed);
        }
      }

      console.log(`✓ Completed: ${file}`);
    }

    console.log('');
    console.log('✓ All migrations completed successfully');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('✗ Migration failed:', error);
    console.error('');
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migrations
runMigrations();
