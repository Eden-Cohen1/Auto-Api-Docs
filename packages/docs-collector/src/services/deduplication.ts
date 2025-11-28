import { CollectRequest } from '@auto-api-docs/shared';
import { RawDataRepository } from '../db/raw-data-repository';
import { collectorConfig } from '../config';

/**
 * Handle deduplication logic for fingerprints and samples
 */
export class DeduplicationService {
  constructor(private repository: RawDataRepository) {}

  /**
   * Process collected data with deduplication
   *
   * Logic:
   * 1. Upsert endpoint
   * 2. Check if fingerprint exists
   * 3. If exists:
   *    - Increment counter
   *    - Only save sample if we have < max samples
   * 4. If new:
   *    - Create fingerprint
   *    - Save sample
   */
  async processCollectedData(data: CollectRequest): Promise<{
    fingerprintId: number;
    isNewFingerprint: boolean;
    sampleSaved: boolean;
  }> {
    // 1. Upsert endpoint
    const endpointId = await this.repository.upsertEndpoint({
      method: data.endpoint.method,
      path: data.endpoint.path,
      normalized_path: data.endpoint.normalizedPath
    });

    // 2. Check if fingerprint exists
    const existingFingerprint = await this.repository.findFingerprintByHash(
      endpointId,
      data.fingerprint.hash,
      data.response.statusCode
    );

    let fingerprintId: number;
    let isNewFingerprint: boolean;
    let sampleSaved = false;

    if (existingFingerprint) {
      // Fingerprint exists
      fingerprintId = existingFingerprint.id;
      isNewFingerprint = false;

      // Always increment occurrence count
      await this.repository.incrementFingerprintCount(fingerprintId);

      // Only save sample if we haven't reached the limit
      const currentSampleCount = await this.repository.getSampleCount(fingerprintId);

      if (currentSampleCount < collectorConfig.maxSamplesPerFingerprint) {
        // We have room for more samples
        await this.saveSample(fingerprintId, data);
        sampleSaved = true;
      } else {
        // We've reached the limit, optionally replace oldest sample
        // For now, we just don't save (could implement replacement strategy later)
        sampleSaved = false;
      }
    } else {
      // New fingerprint
      fingerprintId = await this.repository.createFingerprint({
        endpoint_id: endpointId,
        fingerprint_hash: data.fingerprint.hash,
        status_code: data.response.statusCode,
        structure_signature: data.fingerprint.signature
      });

      isNewFingerprint = true;

      // Always save the first sample
      await this.saveSample(fingerprintId, data);
      sampleSaved = true;
    }

    return {
      fingerprintId,
      isNewFingerprint,
      sampleSaved
    };
  }

  /**
   * Save a sample to the database
   */
  private async saveSample(fingerprintId: number, data: CollectRequest): Promise<void> {
    await this.repository.createSample({
      fingerprint_id: fingerprintId,
      request_headers: JSON.stringify(data.request.headers),
      request_body: data.request.body ? JSON.stringify(data.request.body) : null,
      request_query: JSON.stringify(data.request.query),
      response_headers: JSON.stringify(data.response.headers),
      response_body: JSON.stringify(data.response.body),
      response_time_ms: data.response.responseTimeMs
    });
  }
}
