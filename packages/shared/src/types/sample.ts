/**
 * Sample (request/response pair) types
 */

export interface Sample {
  id: number;
  fingerprint_id: number;
  captured_at: Date;
  request_headers?: string; // JSON
  request_body?: string; // JSON
  request_query?: string; // JSON
  response_headers?: string; // JSON
  response_body: string; // JSON
  response_time_ms?: number;
}

export interface SampleInput {
  fingerprint_id: number;
  request_headers?: string;
  request_body?: string;
  request_query?: string;
  response_headers?: string;
  response_body: string;
  response_time_ms?: number;
}

export interface CollectRequest {
  fingerprint: {
    hash: string;
    signature: string;
    calculationTimeMs: number;
  };
  endpoint: {
    method: string;
    path: string;
    normalizedPath: string;
  };
  request: {
    headers: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
  };
  response: {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
    responseTimeMs: number;
  };
  timestamp: string;
}

export interface CollectResponse {
  success: boolean;
  fingerprintId?: number;
  isNewFingerprint: boolean;
  sampleSaved: boolean;
}
