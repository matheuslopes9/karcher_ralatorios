-- Migration 001: Create users table

CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'ANALYST',
    'VIEWER'
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(512) NOT NULL,
    role            user_role NOT NULL DEFAULT 'VIEWER',
    is_active       BOOLEAN DEFAULT TRUE,
    is_master       BOOLEAN DEFAULT FALSE,
    avatar_url      VARCHAR(500),
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
