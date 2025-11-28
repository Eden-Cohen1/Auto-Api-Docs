import { Request, Response } from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { proxyConfig } from './config';
import { interceptResponse } from './interceptor';

/**
 * Create proxy middleware with response interception
 */
export const proxyMiddleware = createProxyMiddleware({
  target: proxyConfig.targetUrl,
  changeOrigin: true,

  // Intercept response to record it
  selfHandleResponse: true,

  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    const responseBody = responseBuffer.toString('utf8');

    // Record the response asynchronously
    interceptResponse(
      req as Request,
      proxyRes,
      responseBody
    );

    // Return the original response body to the client
    return responseBody;
  }),

  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    (res as Response).status(500).json({
      error: 'Proxy error',
      message: err.message
    });
  },

  logLevel: 'info'
});
