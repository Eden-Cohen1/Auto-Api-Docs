# Auto API Docs

Automatic API Documentation System that learns from real traffic patterns.

## Overview

This system automatically generates comprehensive API documentation by:
- Intercepting API traffic via a transparent proxy
- Inferring schemas using statistical analysis
- Generating human-readable docs with AI
- Displaying everything in a Swagger-like UI

## Key Features

- **Two-tier database**: Separates raw data collection from published documentation
- **Smart fingerprinting**: Efficient deduplication using structure hashing (<2ms)
- **Confidence scoring**: Only publishes when >95% confident
- **CI/CD integration**: Automatic docs updates on each PR
- **Interactive UI**: Swagger-like interface with "Try It Out" functionality
- **Change history**: Track all documentation changes over time

## Quick Start

### Local Development (Without SQL Server)

```bash
# 1. Start SQL Server with Docker
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 --name sql-server \
  -d mcr.microsoft.com/mssql/server:2022-latest

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your settings

# 4. Run database migrations
npm run db:migrate

# 5. Start services (in separate terminals)
npm run dev:collector  # Terminal 1
npm run dev:proxy      # Terminal 2
cd test-vue-app && npm run dev  # Terminal 3

# 6. Access UI
# http://localhost:5173/api-docs
```

### Work Environment (With SQL Server)

```bash
# 1. Configure .env with your work SQL Server details
DB_SERVER=your-sql-server.company.local
DB_USER=your_user
DB_PASSWORD=your_password

# 2. Run migrations (one time)
npm run db:migrate

# 3. Start services
npm run dev:collector  # Terminal 1
npm run dev:proxy      # Terminal 2

# 4. Point your Vue app to proxy
VUE_APP_API_URL=http://localhost:3000 npm run dev
```

## Architecture

```
Developer PC
    ↓
Proxy (3000) → Collector (3001) → SQL Server
    ↓                                  ↓
Backend (8080)              RAW DATA / PUBLISHED DOCS
                                      ↓
                              Vue UI (/api-docs)
```

## Components

- **docs-proxy**: Transparent proxy that intercepts traffic
- **docs-collector**: Saves fingerprints to database
- **docs-analyzer**: Infers schemas from samples
- **docs-pipeline-checker**: CI/CD tool for auto-updates
- **docs-ai-service**: Generates human descriptions
- **docs-ui**: Swagger-like Vue 3 interface
- **shared**: Common types and utilities

## CI/CD Integration

Give this script to your DevOps team to add to your GitLab pipeline:

```yaml
check-api-docs:
  stage: test
  only:
    - merge_requests
  script:
    - /path/to/check-docs-update.sh
  artifacts:
    when: always
  allow_failure: false
```

The script automatically:
- Compares RAW DATA vs PUBLISHED DOCS
- Updates docs if changes are >95% confident
- Fails pipeline if breaking changes detected

## Manual Commands

```bash
# Update documentation manually
npm run update-docs

# With options
npm run update-docs -- --force           # Ignore confidence
npm run update-docs -- --dry-run         # Preview only
npm run update-docs -- --endpoint=/api/users  # Specific endpoint

# Run analyzer manually
npm run analyze

# Generate AI descriptions
npm run generate-descriptions
```

## Database Schemas

### RAW DATA (continuously updated)
- `endpoints`: All discovered API endpoints
- `fingerprints`: Unique response structures
- `samples`: Actual request/response (max 50/fingerprint)
- `inferred_schemas`: Schemas with confidence scores
- `statistics`: Aggregated metrics

### PUBLISHED DOCS (updated only when confident)
- `api_endpoints`: Official documented endpoints
- `api_schemas`: Published schemas (>95% confidence)
- `api_descriptions`: AI-generated documentation
- `api_examples`: Request/response examples
- `change_history`: All documentation changes
- `typescript_types`: Generated TypeScript definitions

## Performance

- Fingerprint calculation: <2ms
- Proxy latency added: <5ms
- Storage: ~1MB per 10k requests (raw), ~100KB (published)
- Analysis: Continuous background processing

## Security

- Only for local development (DO NOT run in production)
- Sensitive data redaction (passwords, tokens, auth headers)
- Database encryption enabled
- API keys in environment variables only

## Tech Stack

- **Backend**: Node.js, TypeScript, Express, SQL Server
- **Frontend**: Vue 3, Vuetify 3, Vite, Pinia
- **AI**: OpenAI GPT-4 (designed for easy migration to internal API)
- **Database**: SQL Server (company standard)

## License

Internal use only.
