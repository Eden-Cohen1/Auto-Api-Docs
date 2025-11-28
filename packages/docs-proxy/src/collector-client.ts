import axios from 'axios';
import { CollectRequest, CollectResponse } from '@auto-api-docs/shared';
import { proxyConfig } from './config';

/**
 * Send collected data to the collector service
 * This is async/fire-and-forget to avoid blocking the proxy
 */
export async function sendToCollector(data: CollectRequest): Promise<void> {
  try {
    const response = await axios.post<CollectResponse>(
      `${proxyConfig.collectorUrl}/api/collect`,
      data,
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      console.warn('Collector returned failure:', response.data);
    }
  } catch (error) {
    // Don't throw - this is fire-and-forget
    // Log error but don't block the proxy
    if (axios.isAxiosError(error)) {
      console.error('Failed to send to collector:', error.message);
    } else {
      console.error('Unexpected error sending to collector:', error);
    }
  }
}
