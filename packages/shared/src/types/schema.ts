/**
 * Schema types for inferred and published schemas
 */

export interface InferredSchema {
  id: number;
  fingerprint_id: number;
  schema_version: number;
  schema_json: string; // JSON Schema format
  typescript_definition?: string;
  confidence_score: number; // 0.0000 to 1.0000
  sample_size: number;
  field_analysis?: string; // JSON
  created_at: Date;
  updated_at: Date;
}

export interface InferredSchemaInput {
  fingerprint_id: number;
  schema_version?: number;
  schema_json: string;
  typescript_definition?: string;
  confidence_score: number;
  sample_size: number;
  field_analysis?: string;
}

export interface PublishedSchema {
  id: number;
  endpoint_id: number;
  status_code: number;
  schema_json: string;
  typescript_definition?: string;
  confidence_score: number;
  source_fingerprint_id?: number;
  published_at: Date;
  updated_at: Date;
  version: number;
}

export interface PublishedSchemaInput {
  endpoint_id: number;
  status_code: number;
  schema_json: string;
  typescript_definition?: string;
  confidence_score: number;
  source_fingerprint_id?: number;
}

export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
  properties?: Record<string, any>;
  items?: any;
  required?: string[];
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface ConfidenceScore {
  overall: number; // 0.0 to 1.0
  sampleAdequacy: number;
  typeStability: number;
  structuralConsistency: number;
  valuePatternConfidence: number;
  breakdown: Record<string, number>; // Per-field confidence
}
