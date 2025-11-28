import * as crypto from 'crypto';
import { FingerprintResult } from '../types/fingerprint';

/**
 * Calculate fingerprint of response structure
 * PERFORMANCE REQUIREMENT: Must complete in <2ms
 *
 * @param data - Response body (parsed JSON)
 * @returns Fingerprint with hash, signature, and calculation time
 */
export function calculateFingerprint(data: any): FingerprintResult {
  const startTime = Date.now();

  // Generate structure signature (sorted keys only, no values)
  const signature = extractStructure(data);

  // Hash the signature
  const hash = crypto.createHash('sha256')
    .update(signature)
    .digest('hex');

  const calculationTimeMs = Date.now() - startTime;

  return { hash, signature, calculationTimeMs };
}

/**
 * Extract structure from object/array recursively
 * Only considers keys and types, not values
 *
 * @param data - Data to extract structure from
 * @param depth - Current recursion depth (prevents infinite loops)
 * @returns Structure signature as string
 */
function extractStructure(data: any, depth = 0): string {
  // Prevent infinite recursion (max depth 10)
  if (depth > 10) return 'MAX_DEPTH';

  const type = typeof data;

  // Handle null/undefined
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';

  // Handle primitives
  if (type !== 'object') return type;

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    // Use first element as template (assumption: homogeneous arrays)
    return `[${extractStructure(data[0], depth + 1)}]`;
  }

  // Handle objects
  const keys = Object.keys(data).sort(); // Sort for consistency
  const structure = keys.map(key => {
    const value = data[key];
    return `${key}:${extractStructure(value, depth + 1)}`;
  }).join(',');

  return `{${structure}}`;
}

/**
 * Example usage:
 *
 * Input: { id: 123, name: "John", tags: ["a", "b"] }
 * Structure: "{id:number,name:string,tags:[string]}"
 * Hash: "a1b2c3d4..."
 *
 * This allows us to:
 * 1. Identify identical structures with different values
 * 2. Deduplicate efficiently
 * 3. Group similar responses together
 */
