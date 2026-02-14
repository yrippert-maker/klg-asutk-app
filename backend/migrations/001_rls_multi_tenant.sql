-- КЛГ АСУ ТК: Row-Level Security (RLS) for multi-tenant isolation
-- Part-M-RU compliance: data isolation between organizations
-- Run after initial migration: alembic upgrade head
-- Разработчик: АО «REFLY»

-- 1. Create app setting for current org
DO $$ BEGIN
    PERFORM set_config('app.current_org_id', '', true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Enable RLS on tenant-scoped tables

-- Organizations: everyone sees their own org; admins see all
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_tenant ON organizations
    USING (
        current_setting('app.current_org_id', true) = ''  -- admin/no tenant set
        OR id = current_setting('app.current_org_id', true)
    );

-- Aircraft: operator sees only their aircraft
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
CREATE POLICY aircraft_tenant ON aircraft
    USING (
        current_setting('app.current_org_id', true) = ''
        OR operator_id = current_setting('app.current_org_id', true)
    );

-- Cert Applications: applicant org sees only their applications
ALTER TABLE cert_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY cert_app_tenant ON cert_applications
    USING (
        current_setting('app.current_org_id', true) = ''
        OR applicant_org_id = current_setting('app.current_org_id', true)
    );

-- Users: org members see only their org
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_tenant ON users
    USING (
        current_setting('app.current_org_id', true) = ''
        OR organization_id = current_setting('app.current_org_id', true)
    );

-- Notifications: user sees only their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_tenant ON notifications
    USING (
        current_setting('app.current_org_id', true) = ''
        OR recipient_user_id IN (
            SELECT id FROM users WHERE organization_id = current_setting('app.current_org_id', true)
        )
    );

-- Airworthiness certificates: via aircraft
ALTER TABLE airworthiness_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY aw_cert_tenant ON airworthiness_certificates
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Maintenance tasks: via aircraft
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY maint_tenant ON maintenance_tasks
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Damage reports: via aircraft
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY damage_tenant ON damage_reports
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Defect reports: via aircraft
ALTER TABLE defect_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY defect_tenant ON defect_reports
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Modifications: via aircraft
ALTER TABLE aircraft_modifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY mod_tenant ON aircraft_modifications
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Risk alerts: via aircraft
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY risk_tenant ON risk_alerts
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- LLP components: via aircraft
ALTER TABLE limited_life_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY llp_tenant ON limited_life_components
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Landing gear: via aircraft
ALTER TABLE landing_gear_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY lg_tenant ON landing_gear_components
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Aircraft history: via aircraft
ALTER TABLE aircraft_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY history_tenant ON aircraft_history
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Audits: via aircraft
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_tenant ON audits
    USING (
        current_setting('app.current_org_id', true) = ''
        OR aircraft_id IN (
            SELECT id FROM aircraft WHERE operator_id = current_setting('app.current_org_id', true)
        )
    );

-- Audit log: org scoped (admins see all)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY auditlog_tenant ON audit_log
    USING (
        current_setting('app.current_org_id', true) = ''
        OR organization_id = current_setting('app.current_org_id', true)
    );

-- 3. Tables WITHOUT RLS (shared reference data):
-- checklist_templates, checklist_items — shared across all orgs
-- legal tables (jurisdictions, legal_documents, etc.) — shared reference
-- aircraft_types — shared reference
-- ingest_job_logs — admin only

-- 4. Grant bypass to the app superuser (for admin operations)
-- ALTER ROLE klg_admin BYPASSRLS;  -- uncomment for production

-- 5. Performance indexes for RLS subqueries
CREATE INDEX IF NOT EXISTS idx_aircraft_operator_id ON aircraft(operator_id);
CREATE INDEX IF NOT EXISTS idx_cert_applications_org ON cert_applications(applicant_org_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(recipient_user_id);
