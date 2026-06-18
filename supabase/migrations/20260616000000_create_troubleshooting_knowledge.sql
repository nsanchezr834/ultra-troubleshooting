-- Migration: Create Troubleshooting Knowledge Base

CREATE TYPE severity_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

CREATE TABLE IF NOT EXISTS troubleshooting_knowledge (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    symptom TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    severity severity_level NOT NULL,
    resolution_protocol TEXT NOT NULL,
    sop_reference VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full Text Search Index for faster lookups
CREATE INDEX IF NOT EXISTS troubleshooting_knowledge_symptom_idx 
ON troubleshooting_knowledge USING GIN (to_tsvector('spanish', symptom));

CREATE INDEX IF NOT EXISTS troubleshooting_knowledge_root_cause_idx 
ON troubleshooting_knowledge USING GIN (to_tsvector('spanish', root_cause));
