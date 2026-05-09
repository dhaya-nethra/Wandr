-- Wandr Database Schema

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR(64) PRIMARY KEY, -- hashedId
    alias VARCHAR(255),
    consent_status VARCHAR(20) DEFAULT 'yes',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_consent_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Participant Authentication table
CREATE TABLE IF NOT EXISTS participant_auth (
    participant_id VARCHAR(64) PRIMARY KEY REFERENCES participants(id),
    password_hash VARCHAR(64) NOT NULL
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(64) PRIMARY KEY,
    participant_id VARCHAR(64) REFERENCES participants(id),
    trip_data JSONB NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    admin_id VARCHAR(64),
    role VARCHAR(50),
    action VARCHAR(100),
    details TEXT,
    prev_hash VARCHAR(64),
    chain_hash VARCHAR(64)
);

-- Admin Users table
CREATE TABLE IF NOT EXISTS admin_users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by VARCHAR(255)
);
