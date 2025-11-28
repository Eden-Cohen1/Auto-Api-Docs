import express from 'express';
import { proxyConfig } from './config';
import { proxyMiddleware } from './proxy';

const app = express();

// Parse JSON bodies (for POST/PUT requests)
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'docs-proxy',
    target: proxyConfig.targetUrl,
    collector: proxyConfig.collectorUrl
  });
});

// Proxy all other requests
app.use('/', proxyMiddleware);

// Start server
app.listen(proxyConfig.port, () => {
  console.log('');
  console.log('================================================');
  console.log('  Auto API Docs - Proxy Server');
  console.log('================================================');
  console.log(`  Status: Running`);
  console.log(`  Port: ${proxyConfig.port}`);
  console.log(`  Proxying to: ${proxyConfig.targetUrl}`);
  console.log(`  Sending data to: ${proxyConfig.collectorUrl}`);
  console.log('');
  console.log(`  Health check: http://localhost:${proxyConfig.port}/health`);
  console.log('');
  console.log('  Point your Vue app to: http://localhost:' + proxyConfig.port);
  console.log('  Example: VUE_APP_API_URL=http://localhost:' + proxyConfig.port);
  console.log('================================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
