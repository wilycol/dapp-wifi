-- Create Processed Webhooks Table for Idempotency
CREATE TABLE IF NOT EXISTS processed_webhooks (
    id TEXT PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Optional, but good practice. Only service_role should access this)
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;

-- No policies needed if we only use service_role, but to be explicit:
-- CREATE POLICY "Service Role Only" ON processed_webhooks USING (false); 
-- (By default RLS denies everything if no policy exists, which is perfect for service_role only access)
