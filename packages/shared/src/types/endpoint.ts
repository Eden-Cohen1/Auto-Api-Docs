/**
 * API Endpoint types
 */

export interface Endpoint {
  id: number;
  method: string;
  path: string;
  normalized_path: string;
  first_seen: Date;
  last_seen: Date;
  request_count: number;
  is_active: boolean;
  metadata?: string; // JSON
}

export interface EndpointInput {
  method: string;
  path: string;
  normalized_path: string;
  metadata?: string;
}

export interface PublishedEndpoint {
  id: number;
  method: string;
  path: string;
  normalized_path: string;
  category?: string;
  tags?: string; // JSON array
  is_deprecated: boolean;
  published_at: Date;
  updated_at: Date;
  version: number;
}

export interface PublishedEndpointInput {
  method: string;
  path: string;
  normalized_path: string;
  category?: string;
  tags?: string;
}

/**
 * Normalize a path by replacing parameters with placeholders
 * Example: /api/users/123 => /api/users/:id
 */
export function normalizePath(path: string): string {
  return path.replace(/\/\d+/g, '/:id')
    .replace(/\/[0-9a-f-]{36}/gi, '/:uuid')
    .replace(/\/[0-9a-f]{24}/gi, '/:objectId');
}
