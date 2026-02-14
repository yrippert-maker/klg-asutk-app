-- Migration: Personnel PLG — сертификация персонала ПЛГ
-- Правовые основания: ВК РФ ст. 52-54; ФАП-147; ФАП-145; EASA Part-66

CREATE TABLE IF NOT EXISTS plg_specialists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    full_name VARCHAR(200) NOT NULL,
    personnel_number VARCHAR(50) NOT NULL,
    position VARCHAR(200) NOT NULL,
    category VARCHAR(10) NOT NULL,  -- A, B1, B2, B3, C (EASA Part-66) / I, II, III (ФАП-147)
    specializations JSONB DEFAULT '[]',  -- типы ВС
    license_number VARCHAR(100),
    license_issued DATE,
    license_expires DATE,
    medical_certificate_expires DATE,
    status VARCHAR(20) DEFAULT 'active',  -- active, suspended, expired, revoked
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    tenant_id UUID,
    UNIQUE(tenant_id, personnel_number)
);

CREATE TABLE IF NOT EXISTS plg_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID NOT NULL REFERENCES plg_specialists(id) ON DELETE CASCADE,
    attestation_type VARCHAR(30) NOT NULL,  -- initial, periodic, extraordinary, type_rating
    program_id VARCHAR(50) NOT NULL,
    program_name VARCHAR(300) NOT NULL,
    training_center VARCHAR(300),
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    hours_theory NUMERIC(6,1) DEFAULT 0,
    hours_practice NUMERIC(6,1) DEFAULT 0,
    exam_score NUMERIC(5,2),
    result VARCHAR(20) NOT NULL,  -- passed, failed, conditional
    certificate_number VARCHAR(100),
    certificate_valid_until DATE,
    examiner_name VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    tenant_id UUID
);

CREATE TABLE IF NOT EXISTS plg_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID NOT NULL REFERENCES plg_specialists(id) ON DELETE CASCADE,
    program_id VARCHAR(50) NOT NULL,
    program_name VARCHAR(300) NOT NULL,
    program_type VARCHAR(30) NOT NULL,  -- recurrent, type_extension, crs_authorization, ndt, human_factors, sms, fuel_tank, ewis, rvsm, etops
    training_center VARCHAR(300),
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    hours_total NUMERIC(6,1) DEFAULT 0,
    result VARCHAR(20) DEFAULT 'passed',
    certificate_number VARCHAR(100),
    next_due DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    tenant_id UUID
);

-- Indexes for compliance reporting
CREATE INDEX IF NOT EXISTS idx_plg_spec_org ON plg_specialists(organization_id);
CREATE INDEX IF NOT EXISTS idx_plg_spec_status ON plg_specialists(status);
CREATE INDEX IF NOT EXISTS idx_plg_spec_tenant ON plg_specialists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plg_att_spec ON plg_attestations(specialist_id);
CREATE INDEX IF NOT EXISTS idx_plg_qual_spec ON plg_qualifications(specialist_id);
CREATE INDEX IF NOT EXISTS idx_plg_qual_due ON plg_qualifications(next_due);
CREATE INDEX IF NOT EXISTS idx_plg_spec_license_exp ON plg_specialists(license_expires);
CREATE INDEX IF NOT EXISTS idx_plg_spec_med_exp ON plg_specialists(medical_certificate_expires);

-- RLS
ALTER TABLE plg_specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE plg_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plg_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS plg_spec_tenant ON plg_specialists
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS plg_att_tenant ON plg_attestations
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS plg_qual_tenant ON plg_qualifications
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE plg_specialists IS 'Реестр специалистов ПЛГ (ВК РФ ст. 52-54; ФАП-147; EASA Part-66)';
COMMENT ON TABLE plg_attestations IS 'Аттестации персонала ПЛГ (ФАП-147 п.17; EASA Part-66.A.25/30)';
COMMENT ON TABLE plg_qualifications IS 'Повышение квалификации (ФАП-145 п.A.35; EASA Part-66.A.40)';
