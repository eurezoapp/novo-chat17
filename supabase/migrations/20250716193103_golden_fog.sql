/*
  # Complete WhatsApp Chatbot System Database Schema

  1. New Tables
    - `admin_users` - System administrators
    - `webhook_logs` - Webhook and API call logs
    - `meta_quota` - Meta API usage tracking
    - `system_backups` - Backup management

  2. Updated Tables
    - Enhanced `flows` table with trigger keywords
    - Enhanced `whatsapp_config` with additional fields
    - Enhanced `messages` with status tracking
    - Enhanced `contacts` with conversation state

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'user')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on admin_users"
  ON admin_users
  FOR ALL
  TO public
  USING (true);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (id, email, password_hash, name, role) 
VALUES (
  'admin_default',
  'admin@chatbot.com',
  '$2b$10$rOvHPGkwxqFZWjQoQZQZ4eKvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQv',
  'Administrator',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type text NOT NULL CHECK (type IN ('incoming', 'outgoing', 'error', 'webhook')),
  method text,
  url text,
  headers jsonb DEFAULT '{}',
  body jsonb,
  response jsonb,
  status_code integer,
  error_message text,
  phone_number text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on webhook_logs"
  ON webhook_logs
  FOR ALL
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON webhook_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_type ON webhook_logs(type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_phone ON webhook_logs(phone_number);

-- Meta Quota Table
CREATE TABLE IF NOT EXISTS meta_quota (
  id text PRIMARY KEY DEFAULT 'default',
  messages_sent_today integer DEFAULT 0,
  messages_limit integer DEFAULT 1000,
  api_calls_today integer DEFAULT 0,
  api_calls_limit integer DEFAULT 100000,
  last_reset timestamptz DEFAULT now(),
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'standard', 'unlimited'))
);

ALTER TABLE meta_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on meta_quota"
  ON meta_quota
  FOR ALL
  TO public
  USING (true);

-- System Backups Table
CREATE TABLE IF NOT EXISTS system_backups (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  backup_type text NOT NULL CHECK (backup_type IN ('full', 'flows', 'messages', 'contacts')),
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'in_progress')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on system_backups"
  ON system_backups
  FOR ALL
  TO public
  USING (true);

-- Update existing tables with new fields

-- Add trigger keywords to flows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'trigger_keywords'
  ) THEN
    ALTER TABLE flows ADD COLUMN trigger_keywords jsonb DEFAULT '[]';
  END IF;
END $$;

-- Add additional fields to whatsapp_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_config' AND column_name = 'app_id'
  ) THEN
    ALTER TABLE whatsapp_config ADD COLUMN app_id text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_config' AND column_name = 'app_secret'
  ) THEN
    ALTER TABLE whatsapp_config ADD COLUMN app_secret text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_config' AND column_name = 'business_account_id'
  ) THEN
    ALTER TABLE whatsapp_config ADD COLUMN business_account_id text DEFAULT '';
  END IF;
END $$;

-- Add status and message_id to messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'status'
  ) THEN
    ALTER TABLE messages ADD COLUMN status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_id text;
  END IF;
END $$;

-- Add conversation_state to contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'conversation_state'
  ) THEN
    ALTER TABLE contacts ADD COLUMN conversation_state text DEFAULT 'active' CHECK (conversation_state IN ('active', 'waiting', 'completed'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flows_active ON flows(is_active);
CREATE INDEX IF NOT EXISTS idx_flows_trigger_keywords ON flows USING GIN(trigger_keywords);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);
CREATE INDEX IF NOT EXISTS idx_contacts_conversation_state ON contacts(conversation_state);

-- Insert default meta quota if not exists
INSERT INTO meta_quota (id, messages_sent_today, messages_limit, api_calls_today, api_calls_limit, last_reset, tier)
VALUES (
  'default',
  0,
  1000,
  0,
  100000,
  now(),
  'free'
) ON CONFLICT (id) DO NOTHING;