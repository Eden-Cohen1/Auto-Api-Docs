-- =============================================
-- Auto API Docs - PUBLISHED DOCS Schema
-- Description: Stores official API documentation (only high-confidence data)
-- =============================================

USE ApiDocsDB;
GO

-- Create published_docs schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'published_docs')
BEGIN
    EXEC('CREATE SCHEMA published_docs');
END
GO

-- Table: api_endpoints
-- Official documented endpoints
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[published_docs].[api_endpoints]') AND type in (N'U'))
BEGIN
    CREATE TABLE published_docs.api_endpoints (
        id INT IDENTITY(1,1) PRIMARY KEY,
        method VARCHAR(10) NOT NULL,
        path VARCHAR(500) NOT NULL,
        normalized_path VARCHAR(500) NOT NULL,
        category VARCHAR(100),                          -- e.g., "Targets", "Settings"
        tags NVARCHAR(MAX),                             -- JSON array
        is_deprecated BIT NOT NULL DEFAULT 0,
        published_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT UQ_published_endpoints UNIQUE (method, normalized_path)
    );

    CREATE INDEX IX_published_endpoints_category ON published_docs.api_endpoints(category);
END
GO

-- Table: api_schemas
-- Published schemas (>95% confidence only)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[published_docs].[api_schemas]') AND type in (N'U'))
BEGIN
    CREATE TABLE published_docs.api_schemas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        endpoint_id INT NOT NULL,
        status_code INT NOT NULL,
        schema_json NVARCHAR(MAX) NOT NULL,             -- JSON Schema
        typescript_definition NVARCHAR(MAX),
        confidence_score DECIMAL(5,4) NOT NULL,         -- Must be >= 0.9500
        source_fingerprint_id INT,                      -- Reference to raw_data
        published_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT FK_api_schemas_endpoint FOREIGN KEY (endpoint_id)
            REFERENCES published_docs.api_endpoints(id) ON DELETE CASCADE,
        CONSTRAINT CHK_api_schemas_confidence CHECK (confidence_score >= 0.9500)
    );

    CREATE INDEX IX_api_schemas_endpoint ON published_docs.api_schemas(endpoint_id);
END
GO

-- Table: api_descriptions
-- AI-generated human-readable documentation
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[published_docs].[api_descriptions]') AND type in (N'U'))
BEGIN
    CREATE TABLE published_docs.api_descriptions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        endpoint_id INT NOT NULL,
        summary NVARCHAR(500),                          -- Short description
        description NVARCHAR(MAX),                      -- Detailed description
        parameters_description NVARCHAR(MAX),           -- JSON: per-param docs
        response_description NVARCHAR(MAX),             -- JSON: per-field docs
        usage_examples NVARCHAR(MAX),                   -- JSON: code examples
        generated_by VARCHAR(50),                       -- "openai-gpt4", "internal-api"
        generated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_api_descriptions_endpoint FOREIGN KEY (endpoint_id)
            REFERENCES published_docs.api_endpoints(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_api_descriptions_endpoint ON published_docs.api_descriptions(endpoint_id);
END
GO

-- Table: api_examples
-- Request/response examples
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[published_docs].[api_examples]') AND type in (N'U'))
BEGIN
    CREATE TABLE published_docs.api_examples (
        id INT IDENTITY(1,1) PRIMARY KEY,
        endpoint_id INT NOT NULL,
        example_name VARCHAR(200),
        request_example NVARCHAR(MAX),                  -- JSON
        response_example NVARCHAR(MAX),                 -- JSON
        description NVARCHAR(500),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_api_examples_endpoint FOREIGN KEY (endpoint_id)
            REFERENCES published_docs.api_endpoints(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_api_examples_endpoint ON published_docs.api_examples(endpoint_id);
END
GO

-- Table: change_history
-- Track all changes to published documentation
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[published_docs].[change_history]') AND type in (N'U'))
BEGIN
    CREATE TABLE published_docs.change_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        endpoint_id INT NOT NULL,
        change_type VARCHAR(50) NOT NULL,               -- "created", "schema_updated", "description_updated"
        old_value NVARCHAR(MAX),                        -- JSON: previous state
        new_value NVARCHAR(MAX),                        -- JSON: new state
        confidence_score DECIMAL(5,4),
        changed_by VARCHAR(100),                        -- "pipeline-auto", "manual", username
        pr_number VARCHAR(50),                          -- Link to PR
        changed_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_change_history_endpoint FOREIGN KEY (endpoint_id)
            REFERENCES published_docs.api_endpoints(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_change_history_endpoint ON published_docs.change_history(endpoint_id);
    CREATE INDEX IX_change_history_date ON published_docs.change_history(changed_at);
END
GO

-- Table: typescript_types
-- Generated TypeScript type definitions
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[published_docs].[typescript_types]') AND type in (N'U'))
BEGIN
    CREATE TABLE published_docs.typescript_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        endpoint_id INT,                                -- NULL for shared types
        type_name VARCHAR(200) NOT NULL,
        type_definition NVARCHAR(MAX) NOT NULL,         -- Full .d.ts content
        dependencies NVARCHAR(MAX),                     -- JSON: array of type names
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_typescript_types_endpoint FOREIGN KEY (endpoint_id)
            REFERENCES published_docs.api_endpoints(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_typescript_types_name ON published_docs.typescript_types(type_name);
END
GO

PRINT 'PUBLISHED DOCS schema created successfully';
