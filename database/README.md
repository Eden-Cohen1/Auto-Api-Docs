# Database Setup

This directory contains SQL Server database migrations for the Auto API Docs system.

## Two Schemas

### 1. raw_data (Continuously Updated)
Stores all fingerprints and samples collected from the proxy:
- `endpoints`: All discovered API endpoints
- `fingerprints`: Unique response structures
- `samples`: Actual request/response pairs (max 50/fingerprint)
- `inferred_schemas`: Schemas inferred from samples with confidence scores
- `statistics`: Aggregated metrics

### 2. published_docs (Updated Only When Confident)
Stores official documentation (>95% confidence only):
- `api_endpoints`: Official documented endpoints
- `api_schemas`: Published schemas
- `api_descriptions`: AI-generated documentation
- `api_examples`: Request/response examples
- `change_history`: All documentation changes
- `typescript_types`: Generated TypeScript definitions

## Running Migrations

### Manual (SQL Server Management Studio)
1. Connect to your SQL Server instance
2. Create database: `CREATE DATABASE ApiDocsDB;`
3. Run `001-create-raw-data-schema.sql`
4. Run `002-create-published-docs-schema.sql`

### Automated (Node.js)
```bash
npm run db:migrate
```

## Environment Variables

Configure these in `.env`:
```
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=ApiDocsDB
DB_USER=api_docs_user
DB_PASSWORD=your_password
```

## Docker SQL Server Setup

If you don't have SQL Server installed:

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 --name sql-server \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

Then run migrations with SA credentials.
