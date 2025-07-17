/*
  # Create chatbot system tables

  1. New Tables
    - `flows`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `nodes` (jsonb)
      - `edges` (jsonb)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `whatsapp_config`
      - `id` (text, primary key)
      - `phone_number` (text)
      - `access_token` (text)
      - `webhook_url` (text)
      - `verify_token` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `messages`
      - `id` (text, primary key)
      - `from` (text)
      - `to` (text)
      - `content` (text)
      - `type` (text)
      - `flow_id` (text, nullable)
      - `node_id` (text, nullable)
      - `timestamp` (timestamp)

    - `contacts`
      - `id` (text, primary key)
      - `phone` (text, unique)
      - `name` (text, nullable)
      - `current_flow` (text, nullable)
      - `current_node` (text, nullable)
      - `variables` (jsonb)
      - `last_interaction` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create whatsapp_config table
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  phone_number TEXT DEFAULT '',
  access_token TEXT DEFAULT '',
  webhook_url TEXT DEFAULT '',
  verify_token TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  flow_id TEXT,
  node_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  current_flow TEXT,
  current_node TEXT,
  variables JSONB DEFAULT '{}',
  last_interaction TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on flows"
  ON flows
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on whatsapp_config"
  ON whatsapp_config
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on messages"
  ON messages
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on contacts"
  ON contacts
  FOR ALL
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flows_active ON flows(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction);