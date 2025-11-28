import { config } from 'dotenv';
import { DatabaseConfig } from '@auto-api-docs/shared';

// Load environment variables
config();

export interface CollectorConfig {
  port: number;
  maxSamplesPerFingerprint: number;
  batchInsertSize: number;
  database: DatabaseConfig;
}

export const collectorConfig: CollectorConfig = {
  port: parseInt(process.env.COLLECTOR_PORT || '3001', 10),
  maxSamplesPerFingerprint: parseInt(process.env.MAX_SAMPLES_PER_FINGERPRINT || '50', 10),
  batchInsertSize: parseInt(process.env.BATCH_INSERT_SIZE || '100', 10),

  database: {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_DATABASE || 'ApiDocsDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    }
  }
};

console.log('Collector Configuration:');
console.log(`  Port: ${collectorConfig.port}`);
console.log(`  Max Samples/Fingerprint: ${collectorConfig.maxSamplesPerFingerprint}`);
console.log(`  Batch Size: ${collectorConfig.batchInsertSize}`);
console.log(`  Database: ${collectorConfig.database.server}:${collectorConfig.database.port}`);
console.log(`  Database Name: ${collectorConfig.database.database}`);
