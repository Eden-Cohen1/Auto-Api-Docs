import { Request, Response } from 'express';
import {
  calculateFingerprint,
  normalizePath,
  redactHeaders,
  redactSensitiveFields,
  CollectRequest
} from '@auto-api-docs/shared';
import { sendToCollector } from './collector-client';

/**
 * Intercept and record API request/response
 */
export async function interceptResponse(
  req: Request,
  proxyRes: any,
  responseBody: any
): Promise<void> {
  const startTime = Date.now();

  try {
    // Parse response body if it's JSON
    let parsedBody: any;
    try {
      parsedBody = typeof responseBody === 'string'
        ? JSON.parse(responseBody)
        : responseBody;
    } catch {
      // Not JSON, skip
      return;
    }

    // Skip if response is not an object/array (e.g., plain string/number)
    if (typeof parsedBody !== 'object' || parsedBody === null) {
      return;
    }

    // Calculate fingerprint (<2ms requirement)
    const fingerprint = calculateFingerprint(parsedBody);

    if (fingerprint.calculationTimeMs > 2) {
      console.warn(`Fingerprint calculation took ${fingerprint.calculationTimeMs}ms (>2ms)`);
    }

    // Prepare data to send to collector
    const collectData: CollectRequest = {
      fingerprint: {
        hash: fingerprint.hash,
        signature: fingerprint.signature,
        calculationTimeMs: fingerprint.calculationTimeMs
      },
      endpoint: {
        method: req.method,
        path: req.path,
        normalizedPath: normalizePath(req.path)
      },
      request: {
        headers: redactHeaders(req.headers as Record<string, string>),
        body: req.body ? redactSensitiveFields(req.body) : undefined,
        query: req.query as Record<string, string>
      },
      response: {
        statusCode: proxyRes.statusCode,
        headers: redactHeaders(proxyRes.headers),
        body: redactSensitiveFields(parsedBody),
        responseTimeMs: Date.now() - startTime
      },
      timestamp: new Date().toISOString()
    };

    // Send to collector asynchronously (fire-and-forget)
    sendToCollector(collectData).catch(err => {
      // Already handled in sendToCollector, but catch here too for safety
      console.error('Error in fire-and-forget collector send:', err);
    });

  } catch (error) {
    // Don't let interceptor errors break the proxy
    console.error('Error in interceptor:', error);
  }
}
