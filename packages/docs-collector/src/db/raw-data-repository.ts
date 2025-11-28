import * as sql from 'mssql';
import { getPool } from './connection';
import {
  Endpoint,
  EndpointInput,
  Fingerprint,
  FingerprintInput,
  Sample,
  SampleInput
} from '@auto-api-docs/shared';

/**
 * Repository for RAW DATA schema operations
 */
export class RawDataRepository {
  /**
   * Upsert an endpoint (create or update last_seen)
   */
  async upsertEndpoint(input: EndpointInput): Promise<number> {
    const pool = await getPool();

    const result = await pool.request()
      .input('method', sql.VarChar(10), input.method)
      .input('path', sql.VarChar(500), input.path)
      .input('normalized_path', sql.VarChar(500), input.normalized_path)
      .input('metadata', sql.NVarChar(sql.MAX), input.metadata || null)
      .query(`
        MERGE raw_data.endpoints AS target
        USING (VALUES (@method, @normalized_path)) AS source (method, normalized_path)
        ON target.method = source.method AND target.normalized_path = source.normalized_path
        WHEN MATCHED THEN
          UPDATE SET
            last_seen = GETDATE(),
            request_count = request_count + 1,
            path = @path,
            metadata = COALESCE(@metadata, target.metadata)
        WHEN NOT MATCHED THEN
          INSERT (method, path, normalized_path, metadata)
          VALUES (@method, @path, @normalized_path, @metadata)
        OUTPUT inserted.id;
      `);

    return result.recordset[0].id;
  }

  /**
   * Find a fingerprint by hash
   */
  async findFingerprintByHash(
    endpointId: number,
    hash: string,
    statusCode: number
  ): Promise<Fingerprint | null> {
    const pool = await getPool();

    const result = await pool.request()
      .input('endpoint_id', sql.Int, endpointId)
      .input('hash', sql.VarChar(64), hash)
      .input('status_code', sql.Int, statusCode)
      .query<Fingerprint>(`
        SELECT * FROM raw_data.fingerprints
        WHERE endpoint_id = @endpoint_id
          AND fingerprint_hash = @hash
          AND status_code = @status_code
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create a new fingerprint
   */
  async createFingerprint(input: FingerprintInput): Promise<number> {
    const pool = await getPool();

    const result = await pool.request()
      .input('endpoint_id', sql.Int, input.endpoint_id)
      .input('fingerprint_hash', sql.VarChar(64), input.fingerprint_hash)
      .input('status_code', sql.Int, input.status_code)
      .input('structure_signature', sql.NVarChar(sql.MAX), input.structure_signature)
      .query(`
        INSERT INTO raw_data.fingerprints (
          endpoint_id, fingerprint_hash, status_code, structure_signature, occurrence_count
        )
        VALUES (@endpoint_id, @fingerprint_hash, @status_code, @structure_signature, 1);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    return result.recordset[0].id;
  }

  /**
   * Increment fingerprint occurrence count
   */
  async incrementFingerprintCount(fingerprintId: number): Promise<void> {
    const pool = await getPool();

    await pool.request()
      .input('fingerprint_id', sql.Int, fingerprintId)
      .query(`
        UPDATE raw_data.fingerprints
        SET occurrence_count = occurrence_count + 1,
            last_seen = GETDATE()
        WHERE id = @fingerprint_id
      `);
  }

  /**
   * Get sample count for a fingerprint
   */
  async getSampleCount(fingerprintId: number): Promise<number> {
    const pool = await getPool();

    const result = await pool.request()
      .input('fingerprint_id', sql.Int, fingerprintId)
      .query(`
        SELECT COUNT(*) AS count
        FROM raw_data.samples
        WHERE fingerprint_id = @fingerprint_id
      `);

    return result.recordset[0].count;
  }

  /**
   * Create a sample
   */
  async createSample(input: SampleInput): Promise<number> {
    const pool = await getPool();

    const result = await pool.request()
      .input('fingerprint_id', sql.Int, input.fingerprint_id)
      .input('request_headers', sql.NVarChar(sql.MAX), input.request_headers || null)
      .input('request_body', sql.NVarChar(sql.MAX), input.request_body || null)
      .input('request_query', sql.NVarChar(sql.MAX), input.request_query || null)
      .input('response_headers', sql.NVarChar(sql.MAX), input.response_headers || null)
      .input('response_body', sql.NVarChar(sql.MAX), input.response_body)
      .input('response_time_ms', sql.Int, input.response_time_ms || null)
      .query(`
        INSERT INTO raw_data.samples (
          fingerprint_id, request_headers, request_body, request_query,
          response_headers, response_body, response_time_ms
        )
        VALUES (
          @fingerprint_id, @request_headers, @request_body, @request_query,
          @response_headers, @response_body, @response_time_ms
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);

    // Update sample count on fingerprint
    await pool.request()
      .input('fingerprint_id', sql.Int, input.fingerprint_id)
      .query(`
        UPDATE raw_data.fingerprints
        SET sample_count = sample_count + 1
        WHERE id = @fingerprint_id
      `);

    return result.recordset[0].id;
  }

  /**
   * Delete the oldest sample for a fingerprint
   */
  async deleteOldestSample(fingerprintId: number): Promise<void> {
    const pool = await getPool();

    await pool.request()
      .input('fingerprint_id', sql.Int, fingerprintId)
      .query(`
        DELETE FROM raw_data.samples
        WHERE id = (
          SELECT TOP 1 id
          FROM raw_data.samples
          WHERE fingerprint_id = @fingerprint_id
          ORDER BY captured_at ASC
        );

        UPDATE raw_data.fingerprints
        SET sample_count = sample_count - 1
        WHERE id = @fingerprint_id;
      `);
  }
}
