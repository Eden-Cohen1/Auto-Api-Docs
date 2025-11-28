import express, { Request, Response } from 'express';
import { CollectRequest, CollectResponse } from '@auto-api-docs/shared';
import { collectorConfig } from './config';
import { RawDataRepository } from './db/raw-data-repository';
import { DeduplicationService } from './services/deduplication';
import { getPool } from './db/connection';

const app = express();

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Initialize services
const repository = new RawDataRepository();
const deduplicationService = new DeduplicationService(repository);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'docs-collector',
    database: collectorConfig.database.database
  });
});

/**
 * Collect endpoint - receives data from proxy
 */
app.post('/api/collect', async (req: Request, res: Response) => {
  try {
    const data: CollectRequest = req.body;

    // Validate request
    if (!data.fingerprint || !data.endpoint || !data.response) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: missing required fields'
      });
    }

    // Process with deduplication
    const result = await deduplicationService.processCollectedData(data);

    // Log if fingerprint calculation was slow
    if (data.fingerprint.calculationTimeMs > 2) {
      console.warn(
        `⚠ Slow fingerprint: ${data.endpoint.method} ${data.endpoint.path} ` +
        `(${data.fingerprint.calculationTimeMs}ms)`
      );
    }

    // Log new fingerprints
    if (result.isNewFingerprint) {
      console.log(
        `✓ New fingerprint: ${data.endpoint.method} ${data.endpoint.path} ` +
        `[${data.response.statusCode}]`
      );
    }

    const response: CollectResponse = {
      success: true,
      fingerprintId: result.fingerprintId,
      isNewFingerprint: result.isNewFingerprint,
      sampleSaved: result.sampleSaved
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing collect request:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get statistics endpoint
 */
app.get('/api/stats', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM raw_data.endpoints) AS total_endpoints,
        (SELECT COUNT(*) FROM raw_data.fingerprints) AS total_fingerprints,
        (SELECT COUNT(*) FROM raw_data.samples) AS total_samples,
        (SELECT SUM(occurrence_count) FROM raw_data.fingerprints) AS total_requests
    `);

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  // Test database connection
  try {
    await getPool();
  } catch (error) {
    console.error('Failed to connect to database. Please check your configuration.');
    process.exit(1);
  }

  app.listen(collectorConfig.port, () => {
    console.log('');
    console.log('================================================');
    console.log('  Auto API Docs - Collector Service');
    console.log('================================================');
    console.log(`  Status: Running`);
    console.log(`  Port: ${collectorConfig.port}`);
    console.log(`  Database: ${collectorConfig.database.database}`);
    console.log(`  Max Samples: ${collectorConfig.maxSamplesPerFingerprint}`);
    console.log('');
    console.log(`  Health: http://localhost:${collectorConfig.port}/health`);
    console.log(`  Stats: http://localhost:${collectorConfig.port}/api/stats`);
    console.log('');
    console.log('  Ready to receive data from proxy');
    console.log('================================================');
    console.log('');
  });
}
