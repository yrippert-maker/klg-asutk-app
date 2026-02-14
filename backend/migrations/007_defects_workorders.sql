-- Migration: Defects + Work Orders
-- ФАП-145 п.A.50-65; EASA Part-M.A.403; Part-145

CREATE TABLE IF NOT EXISTS defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aircraft_id UUID REFERENCES aircraft(id),
    aircraft_reg VARCHAR(20) NOT NULL,
    ata_chapter VARCHAR(10),
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'minor',
    discovered_by VARCHAR(200),
    discovered_during VARCHAR(30) DEFAULT 'preflight',
    component_pn VARCHAR(100),
    component_sn VARCHAR(100),
    mel_reference VARCHAR(50),
    deferred BOOLEAN DEFAULT false,
    deferred_until DATE,
    corrective_action TEXT,
    status VARCHAR(20) DEFAULT 'open',
    rectified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    tenant_id UUID
);

CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wo_number VARCHAR(50) NOT NULL,
    aircraft_id UUID REFERENCES aircraft(id),
    aircraft_reg VARCHAR(20) NOT NULL,
    wo_type VARCHAR(30) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    ata_chapters JSONB DEFAULT '[]',
    related_ad_id UUID REFERENCES ad_directives(id),
    related_sb_id UUID REFERENCES service_bulletins(id),
    related_defect_id UUID REFERENCES defects(id),
    maintenance_program_ref VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'draft',
    planned_start TIMESTAMPTZ,
    planned_end TIMESTAMPTZ,
    estimated_manhours NUMERIC(8,1) DEFAULT 0,
    actual_manhours NUMERIC(8,1),
    assigned_to VARCHAR(200),
    parts_required JSONB DEFAULT '[]',
    parts_used JSONB DEFAULT '[]',
    findings TEXT,
    crs_signed_by VARCHAR(200),
    crs_date TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    tenant_id UUID,
    UNIQUE(tenant_id, wo_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_defects_aircraft ON defects(aircraft_reg);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_wo_aircraft ON work_orders(aircraft_reg);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_wo_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_wo_type ON work_orders(wo_type);

-- RLS
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE defects IS 'Дефекты ВС (ФАП-145 п.A.50; EASA Part-M.A.403)';
COMMENT ON TABLE work_orders IS 'Наряды на ТО (ФАП-145 п.A.50-65; EASA Part-145)';
