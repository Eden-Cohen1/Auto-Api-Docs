import * as sql from 'mssql';
import { collectorConfig } from '../config';

let pool: sql.ConnectionPool | null = null;

/**
 * Get or create SQL Server connection pool
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const config: sql.config = {
    server: collectorConfig.database.server,
    port: collectorConfig.database.port,
    database: collectorConfig.database.database,
    user: collectorConfig.database.user,
    password: collectorConfig.database.password,
    options: {
      encrypt: collectorConfig.database.options.encrypt,
      trustServerCertificate: collectorConfig.database.options.trustServerCertificate,
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000
    }
  };

  try {
    pool = await new sql.ConnectionPool(config).connect();
    console.log('✓ Connected to SQL Server');
    return pool;
  } catch (error) {
    console.error('✗ Failed to connect to SQL Server:', error);
    throw error;
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('✓ SQL Server connection closed');
  }
}

// Handle cleanup on process exit
process.on('SIGTERM', async () => {
  await closePool();
});

process.on('SIGINT', async () => {
  await closePool();
});
