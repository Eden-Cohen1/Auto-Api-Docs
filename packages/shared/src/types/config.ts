/**
 * Configuration types
 */

export interface DatabaseConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

export interface ProxyConfig {
  port: number;
  targetUrl: string;
  collectorUrl: string;
}

export interface CollectorConfig {
  port: number;
  maxSamplesPerFingerprint: number;
  batchInsertSize: number;
}

export interface AnalyzerConfig {
  intervalMs: number;
  confidenceThreshold: number;
}

export interface AIServiceConfig {
  provider: 'openai' | 'internal';
  apiKey?: string;
  model?: string;
  rateLimitPerMinute: number;
  cacheTtlHours: number;
}

export interface PipelineConfig {
  confidenceThreshold: number;
  prCommentEnabled: boolean;
}
