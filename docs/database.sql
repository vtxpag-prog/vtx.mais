-- =============================================================================
-- BANCO DE DADOS: CLUBE VTXMAIS (BENEFÍCIOS, CUPONS & LEADS)
-- Compatível com PostgreSQL 14+ e MySQL 8+
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'visualizador' CHECK (role IN ('admin', 'gestor', 'visualizador')),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    logo_url VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offers (
    id VARCHAR(50) PRIMARY KEY,
    partner_id VARCHAR(50) NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    discount_value VARCHAR(100) NOT NULL,
    discount_type VARCHAR(30) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'cashback', 'gift')),
    coupon_code VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    valid_until DATE NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    terms TEXT,
    address VARCHAR(255) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    saves_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    rating DECIMAL(2, 1) DEFAULT 5.0,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    coupon_code VARCHAR(50) NOT NULL,
    offer_id VARCHAR(50) REFERENCES offers(id) ON DELETE SET NULL,
    offer_title VARCHAR(200) NOT NULL,
    partner_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    user_cep VARCHAR(10) NOT NULL,
    user_city VARCHAR(100),
    user_state VARCHAR(2),
    distance_km DECIMAL(6, 1),
    crm_status VARCHAR(30) DEFAULT 'pendente' CHECK (crm_status IN ('enviado', 'sucesso', 'falha', 'pendente')),
    crm_response TEXT,
    origin VARCHAR(100) DEFAULT 'Site Público VTXMais',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_configurations (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL DEFAULT 'RD Station / Webhook Geral',
    webhook_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255),
    enabled BOOLEAN DEFAULT TRUE,
    field_mapping JSON NOT NULL,
    last_test_status VARCHAR(30),
    last_test_message TEXT,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_logs (
    id VARCHAR(50) PRIMARY KEY,
    lead_id VARCHAR(50),
    lead_name VARCHAR(150),
    endpoint VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    success BOOLEAN NOT NULL,
    request_payload JSON NOT NULL,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ÍNDICES DE PERFORMANCE PARA BUSCA E GEOLOCALIZAÇÃO
-- =============================================================================
CREATE INDEX idx_offers_category ON offers(category);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_featured ON offers(is_featured);
CREATE INDEX idx_offers_coords ON offers(latitude, longitude);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_coupon ON leads(coupon_code);
CREATE INDEX idx_leads_category ON leads(category);
CREATE INDEX idx_partners_status ON partners(status);
