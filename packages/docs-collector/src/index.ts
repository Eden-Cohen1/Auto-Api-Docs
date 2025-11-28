import { startServer } from './server';

/**
 * Main entry point for the collector service
 */
async function main() {
  try {
    // Start the server
    await startServer();

    // TODO: Start background worker/analyzer in Phase 2
    // This will be implemented when we build the analyzer package
  } catch (error) {
    console.error('Fatal error starting collector:', error);
    process.exit(1);
  }
}

// Start the application
main();
