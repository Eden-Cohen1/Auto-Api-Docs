-- =============================================
-- Auto API Docs - RAW DATA Schema
-- Description: Stores all fingerprints and samples collected from proxy
-- =============================================

USE ApiDocsDB;
GO

-- Create raw_data schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'raw_data')
BEGIN
    EXEC('CREATE SCHEMA raw_data');
END
GO

-- Table: endpoints
-- Stores all discovered API endpoints
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[raw_data].[endpoints]') AND type in (N'U'))
BEGIN
    CREATE TABLE raw_data.endpoints (
        id INT IDENTITY(1,1) PRIMARY KEY,
        method VARCHAR(10) NOT NULL,                    -- GET, POST, PUT, DELETE, etc.
        path VARCHAR(500) NOT NULL,                     -- /api/targets/{id}
        normalized_path VARCHAR(500) NOT NULL,          -- /api/targets/:id
        first_seen DATETIME2 NOT NULL DEFAULT GETDATE(),
        last_seen DATETIME2 NOT NULL DEFAULT GETDATE(),
        request_count INT NOT NULL DEFAULT 0,
        is_active BIT NOT NULL DEFAULT 1,
        metadata NVARCHAR(MAX),                         -- JSON: {category, tags, etc}
        CONSTRAINT UQ_endpoints_method_path UNIQUE (method, normalized_path)
    );

    CREATE INDEX IX_endpoints_normalized_path ON raw_data.endpoints(normalized_path);
    CREATE INDEX IX_endpoints_last_seen ON raw_data.endpoints(last_seen);
END
GO

-- Table: fingerprints
-- Unique response structure fingerprints
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[raw_data].[fingerprints]') AND type in (N'U'))
BEGIN
    CREATE TABLE raw_data.fingerprints (
        id INT IDENTITY(1,1) PRIMARY KEY,
        endpoint_id INT NOT NULL,
        fingerprint_hash VARCHAR(64) NOT NULL,          -- SHA-256 of structure
        status_code INT NOT NULL,                       -- 200, 404, etc.
        structure_signature NVARCHAR(MAX) NOT NULL,     -- JSON: sorted keys tree
        first_seen DATETIME2 NOT NULL DEFAULT GETDATE(),
        last_seen DATETIME2 NOT NULL DEFAULT GETDATE(),
        occurrence_count INT NOT NULL DEFAULT 0,        -- How many times seen
        sample_count INT NOT NULL DEFAULT 0,            -- Samples stored (max 50)
        CONSTRAINT FK_fingerprints_endpoint FOREIGN KEY (endpoint_id)
            REFERENCES raw_data.endpoints(id) ON DELETE CASCADE,
        CONSTRAINT UQ_fingerprints_hash UNIQUE (endpoint_id, fingerprint_hash, status_code)
    );

    CREATE INDEX IX_fingerprints_endpoint ON raw_data.fingerprints(endpoint_id);
    CREATE INDEX IX_fingerprints_hash ON raw_data.fingerprints(fingerprint_hash);
END
GO

-- Table: samples
-- Actual request/response samples (max 50 per fingerprint)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[raw_data].[samples]') AND type in (N'U'))
BEGIN
    CREATE TABLE raw_data.samples (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fingerprint_id INT NOT NULL,
        captured_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        request_headers NVARCHAR(MAX),                  -- JSON
        request_body NVARCHAR(MAX),                     -- JSON
        request_query NVARCHAR(MAX),                    -- JSON
        response_headers NVARCHAR(MAX),                 -- JSON
        response_body NVARCHAR(MAX) NOT NULL,           -- JSON
        response_time_ms INT,                           -- Response time
        CONSTRAINT FK_samples_fingerprint FOREIGN KEY (fingerprint_id)
            REFERENCES raw_data.fingerprints(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_samples_fingerprint ON raw_data.samples(fingerprint_id);
    CREATE INDEX IX_samples_captured_at ON raw_data.samples(captured_at);
END
GO

-- Table: inferred_schemas
-- Schemas inferred from samples with confidence scores
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[raw_data].[inferred_schemas]') AND type in (N'U'))
BEGIN
    CREATE TABLE raw_data.inferred_schemas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fingerprint_id INT NOT NULL,
        schema_version INT NOT NULL DEFAULT 1,
        schema_json NVARCHAR(MAX) NOT NULL,             -- JSON Schema format
        typescript_definition NVARCHAR(MAX),            -- Generated TypeScript
        confidence_score DECIMAL(5,4) NOT NULL,         -- 0.0000 to 1.0000
        sample_size INT NOT NULL,                       -- Samples used for inference
        field_analysis NVARCHAR(MAX),                   -- JSON: per-field stats
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_inferred_schemas_fingerprint FOREIGN KEY (fingerprint_id)
            REFERENCES raw_data.fingerprints(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_inferred_schemas_fingerprint ON raw_data.inferred_schemas(fingerprint_id);
    CREATE INDEX IX_inferred_schemas_confidence ON raw_data.inferred_schemas(confidence_score);
END
GO

-- Table: statistics
-- Aggregated statistics for monitoring
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[raw_data].[statistics]') AND type in (N'U'))
BEGIN
    CREATE TABLE raw_data.statistics (
        id INT IDENTITY(1,1) PRIMARY KEY,
        endpoint_id INT NOT NULL,
        date DATE NOT NULL,
        total_requests INT NOT NULL DEFAULT 0,
        unique_fingerprints INT NOT NULL DEFAULT 0,
        avg_response_time_ms INT,
        error_count INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_statistics_endpoint FOREIGN KEY (endpoint_id)
            REFERENCES raw_data.endpoints(id) ON DELETE CASCADE,
        CONSTRAINT UQ_statistics_endpoint_date UNIQUE (endpoint_id, date)
    );

    CREATE INDEX IX_statistics_date ON raw_data.statistics(date);
END
GO

PRINT 'RAW DATA schema created successfully';
