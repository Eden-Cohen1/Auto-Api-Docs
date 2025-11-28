/**
 * Fingerprint-related types
 */

export interface FingerprintResult {
  /** SHA-256 hash of the response structure */
  hash: string;

  /** JSON structure signature (sorted keys, no values) */
  signature: string;

  /** Time taken to calculate fingerprint (ms) */
  calculationTimeMs: number;
}

export interface Fingerprint {
  id: number;
  endpoint_id: number;
  fingerprint_hash: string;
  status_code: number;
  structure_signature: string;
  first_seen: Date;
  last_seen: Date;
  occurrence_count: number;
  sample_count: number;
}

export interface FingerprintInput {
  endpoint_id: number;
  fingerprint_hash: string;
  status_code: number;
  structure_signature: string;
}
