ALTER TABLE analysis_results
ADD COLUMN IF NOT EXISTS contact_request_id UUID REFERENCES contact_requests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS audit_context_id UUID REFERENCES audit_contexts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_analysis_results_contact_request_id
ON analysis_results(contact_request_id);

CREATE INDEX IF NOT EXISTS idx_analysis_results_audit_context_id
ON analysis_results(audit_context_id);
