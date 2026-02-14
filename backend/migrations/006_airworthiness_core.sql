-- Migration: Airworthiness Core — AD, SB, Life Limits, Maintenance Programs, Components
-- ВК РФ ст. 36, 37, 37.2; ФАП-148; ФАП-145; EASA Part-M; ICAO Annex 6/8

CREATE TABLE IF NOT EXISTS ad_directives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    issuing_authority VARCHAR(50) DEFAULT 'FATA',
    aircraft_types JSONB DEFAULT '[]',
    ata_chapter VARCHAR(10),
    effective_date DATE NOT NULL,
    compliance_type VARCHAR(20) DEFAULT 'mandatory',
    compliance_deadline DATE,
    repetitive BOOLEAN DEFAULT false,
    repetitive_interval_hours NUMERIC(8,1),
    repetitive_interval_days INTEGER,
    description TEXT,
    affected_parts JSONB DEFAULT '[]',
    supersedes VARCHAR(100),
    status VARCHAR(20) DEFAULT 'open',
    compliance_date DATE,
    compliance_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    tenant_id UUID
);

CREATE TABLE IF NOT EXISTS service_bulletins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    manufacturer VARCHAR(200) NOT NULL,
    aircraft_types JSONB DEFAULT '[]',
    ata_chapter VARCHAR(10),
    category VARCHAR(20) DEFAULT 'recommended',
    issued_date DATE NOT NULL,
    compliance_deadline DATE,
    estimated_manhours NUMERIC(6,1),
    description TEXT,
    related_ad UUID REFERENCES ad_directives(id),
    status VARCHAR(20) DEFAULT 'open',
    incorporation_date DATE,
    incorporation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    tenant_id UUID
);

CREATE TABLE IF NOT EXISTS life_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aircraft_id UUID REFERENCES aircraft(id),
    component_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    limit_type VARCHAR(20) NOT NULL,
    calendar_limit_months INTEGER,
    flight_hours_limit NUMERIC(10,1),
    cycles_limit INTEGER,
    current_hours NUMERIC(10,1) DEFAULT 0,
    current_cycles INTEGER DEFAULT 0,
    install_date DATE,
    last_overhaul_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    tenant_id UUID
);

CREATE TABLE IF NOT EXISTS maintenance_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(300) NOT NULL,
    aircraft_type VARCHAR(100) NOT NULL,
    revision VARCHAR(20) DEFAULT 'Rev.0',
    approved_by VARCHAR(200),
    approval_date DATE,
    tasks JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    tenant_id UUID
);

CREATE TABLE IF NOT EXISTS aircraft_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aircraft_id UUID REFERENCES aircraft(id),
    name VARCHAR(200) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    ata_chapter VARCHAR(10),
    manufacturer VARCHAR(200),
    install_date DATE,
    install_position VARCHAR(200),
    current_hours NUMERIC(10,1) DEFAULT 0,
    current_cycles INTEGER DEFAULT 0,
    condition VARCHAR(20) DEFAULT 'serviceable',
    certificate_type VARCHAR(50),
    certificate_number VARCHAR(100),
    last_shop_visit DATE,
    next_overhaul_due DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    tenant_id UUID,
    UNIQUE(tenant_id, serial_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_status ON ad_directives(status);
CREATE INDEX IF NOT EXISTS idx_ad_type ON ad_directives USING gin(aircraft_types);
CREATE INDEX IF NOT EXISTS idx_sb_status ON service_bulletins(status);
CREATE INDEX IF NOT EXISTS idx_ll_aircraft ON life_limits(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_comp_aircraft ON aircraft_components(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_comp_condition ON aircraft_components(condition);

-- RLS
ALTER TABLE ad_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircraft_components ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE ad_directives IS 'Директивы ЛГ (ВК РФ ст. 37; ФАП-148 п.4.3; EASA Part-M.A.301)';
COMMENT ON TABLE service_bulletins IS 'Сервисные бюллетени (ФАП-148 п.4.5; EASA Part-21.A.3B)';
COMMENT ON TABLE life_limits IS 'Ресурсы и сроки службы (ФАП-148 п.4.2; EASA Part-M.A.302)';
COMMENT ON TABLE maintenance_programs IS 'Программы ТО (ФАП-148 п.3; ICAO Annex 6 Part I 8.3)';
COMMENT ON TABLE aircraft_components IS 'Карточки компонентов (ФАП-145 п.A.42; EASA Part-M.A.501)';
