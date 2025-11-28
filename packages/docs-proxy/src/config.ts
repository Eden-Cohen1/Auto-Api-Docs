import { config } from 'dotenv';

// Load environment variables
config();

export interface ProxyConfig {
  port: number;
  targetUrl: string;
  collectorUrl: string;
}

export const proxyConfig: ProxyConfig = {
  port: parseInt(process.env.PROXY_PORT || '3000', 10),
  targetUrl: process.env.TARGET_API_URL || 'http://localhost:8080',
  collectorUrl: process.env.COLLECTOR_URL || 'http://localhost:3001'
};

console.log('Proxy Configuration:');
console.log(`  Port: ${proxyConfig.port}`);
console.log(`  Target API: ${proxyConfig.targetUrl}`);
console.log(`  Collector: ${proxyConfig.collectorUrl}`);
