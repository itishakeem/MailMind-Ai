-- Tracks per-user agent message counts for free-tier rate limiting (10 msgs / 24 hrs).
-- Only new AI inference calls are logged (not pending-action confirmations).

CREATE TABLE IF NOT EXISTS agent_message_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_message_logs_user_created
  ON agent_message_logs (user_id, created_at DESC);

ALTER TABLE agent_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agent logs"
  ON agent_message_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own agent logs"
  ON agent_message_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
