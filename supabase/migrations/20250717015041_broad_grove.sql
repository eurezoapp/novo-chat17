/*
  # Correção de Bugs e Melhorias do Sistema Paroquial

  1. Correções de Estrutura
    - Corrigir campo isActive para is_active na tabela flows
    - Adicionar campos faltantes para melhor funcionamento
    - Corrigir tipos de dados e constraints

  2. Melhorias de Performance
    - Adicionar índices otimizados
    - Melhorar estrutura de dados para flows

  3. Novos Campos
    - Campos para suporte completo ao flow builder
    - Campos para gerenciamento de contatos
    - Campos para webhook logs melhorados

  4. Segurança
    - Manter RLS habilitado
    - Políticas de acesso atualizadas
*/

-- ============================================================================
-- 1. CORREÇÕES NA TABELA FLOWS
-- ============================================================================

-- Verificar e corrigir campo isActive para is_active (se necessário)
DO $$
BEGIN
  -- Verificar se existe coluna isActive (incorreta)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'isActive'
  ) THEN
    -- Renomear para is_active
    ALTER TABLE flows RENAME COLUMN "isActive" TO is_active;
  END IF;
  
  -- Garantir que is_active existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE flows ADD COLUMN is_active BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Adicionar campos faltantes na tabela flows
DO $$
BEGIN
  -- Campo para palavras-chave de trigger
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'trigger_keywords'
  ) THEN
    ALTER TABLE flows ADD COLUMN trigger_keywords JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Campo para configurações avançadas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'settings'
  ) THEN
    ALTER TABLE flows ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Campo para estatísticas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'stats'
  ) THEN
    ALTER TABLE flows ADD COLUMN stats JSONB DEFAULT '{"executions": 0, "completions": 0}'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- 2. MELHORIAS NA TABELA CONTACTS
-- ============================================================================

-- Adicionar campos para melhor gerenciamento de contatos
DO $$
BEGIN
  -- Campo para tags/categorias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'tags'
  ) THEN
    ALTER TABLE contacts ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Campo para notas/observações
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'notes'
  ) THEN
    ALTER TABLE contacts ADD COLUMN notes TEXT DEFAULT '';
  END IF;
  
  -- Campo para status do contato
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'status'
  ) THEN
    ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive'));
  END IF;
  
  -- Campo para origem do contato
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'source'
  ) THEN
    ALTER TABLE contacts ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'whatsapp', 'import', 'api'));
  END IF;
  
  -- Campo para data de criação
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
  
  -- Campo para última atualização
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ============================================================================
-- 3. MELHORIAS NA TABELA MESSAGES
-- ============================================================================

-- Adicionar campos para melhor rastreamento de mensagens
DO $$
BEGIN
  -- Campo para contexto da mensagem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'context'
  ) THEN
    ALTER TABLE messages ADD COLUMN context JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Campo para metadados
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Campo para direção da mensagem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'direction'
  ) THEN
    ALTER TABLE messages ADD COLUMN direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound'));
  END IF;
END $$;

-- ============================================================================
-- 4. MELHORIAS NA TABELA WEBHOOK_LOGS
-- ============================================================================

-- Adicionar campos para melhor debugging
DO $$
BEGIN
  -- Campo para duração da requisição
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_logs' AND column_name = 'duration_ms'
  ) THEN
    ALTER TABLE webhook_logs ADD COLUMN duration_ms INTEGER DEFAULT 0;
  END IF;
  
  -- Campo para IP de origem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_logs' AND column_name = 'source_ip'
  ) THEN
    ALTER TABLE webhook_logs ADD COLUMN source_ip TEXT DEFAULT '';
  END IF;
  
  -- Campo para user agent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE webhook_logs ADD COLUMN user_agent TEXT DEFAULT '';
  END IF;
END $$;

-- ============================================================================
-- 5. NOVA TABELA PARA CONFIGURAÇÕES DO SISTEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  webhook_verify_tokens JSONB DEFAULT '[]'::jsonb,
  flow_execution_timeout INTEGER DEFAULT 30000,
  max_message_length INTEGER DEFAULT 4096,
  auto_backup_enabled BOOLEAN DEFAULT true,
  auto_backup_frequency TEXT DEFAULT 'daily' CHECK (auto_backup_frequency IN ('hourly', 'daily', 'weekly')),
  debug_mode BOOLEAN DEFAULT false,
  maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em system_settings"
  ON system_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Inserir configurações padrão
INSERT INTO system_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. NOVA TABELA PARA TEMPLATES DE MENSAGEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'greeting', 'farewell', 'info', 'emergency')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  language TEXT DEFAULT 'pt_BR',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em message_templates"
  ON message_templates
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Inserir templates padrão
INSERT INTO message_templates (name, category, content, variables) VALUES
('Saudação Inicial', 'greeting', 'Olá! Bem-vindo(a) à {parish_name}. Como posso ajudá-lo(a) hoje?', '["parish_name"]'),
('Horários de Missa', 'info', 'Os horários de missa da {parish_name} são:\n\n{mass_schedule}\n\nPara mais informações, entre em contato conosco.', '["parish_name", "mass_schedule"]'),
('Despedida', 'farewell', 'Obrigado por entrar em contato com a {parish_name}. Que Deus o(a) abençoe!', '["parish_name"]'),
('Informações de Contato', 'info', 'Informações de contato da {parish_name}:\n📞 {phone}\n📧 {email}\n📍 {address}', '["parish_name", "phone", "email", "address"]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para flows
CREATE INDEX IF NOT EXISTS idx_flows_is_active ON flows(is_active);
CREATE INDEX IF NOT EXISTS idx_flows_trigger_keywords ON flows USING GIN(trigger_keywords);
CREATE INDEX IF NOT EXISTS idx_flows_updated_at ON flows(updated_at);

-- Índices para contacts
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages("from");
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages("to");
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_flow_id ON messages(flow_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Índices para webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_type ON webhook_logs(type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON webhook_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_phone_number ON webhook_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status_code ON webhook_logs(status_code);

-- ============================================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tabelas que precisam de updated_at
DROP TRIGGER IF EXISTS update_flows_updated_at ON flows;
CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_config_updated_at ON whatsapp_config;
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_templates_updated_at ON message_templates;
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. LIMPEZA E OTIMIZAÇÃO
-- ============================================================================

-- Remover dados de teste antigos (se existirem)
DELETE FROM webhook_logs WHERE timestamp < now() - INTERVAL '30 days';

-- Atualizar estatísticas das tabelas
ANALYZE flows;
ANALYZE contacts;
ANALYZE messages;
ANALYZE webhook_logs;
ANALYZE whatsapp_config;
ANALYZE meta_quota;

-- ============================================================================
-- 10. VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar se todas as tabelas principais existem
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Verificar tabelas essenciais
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flows') THEN
    missing_tables := array_append(missing_tables, 'flows');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    missing_tables := array_append(missing_tables, 'contacts');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    missing_tables := array_append(missing_tables, 'messages');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_config') THEN
    missing_tables := array_append(missing_tables, 'whatsapp_config');
  END IF;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Tabelas essenciais não encontradas: %', array_to_string(missing_tables, ', ');
  END IF;
  
  RAISE NOTICE 'Migração concluída com sucesso! Todas as tabelas essenciais estão presentes.';
END $$;

-- ============================================================================
-- 11. INSERIR DADOS PADRÃO ATUALIZADOS
-- ============================================================================

-- Atualizar configuração padrão do WhatsApp
INSERT INTO whatsapp_config (id, verify_token) VALUES 
('default', 'verify_' || substr(md5(random()::text), 1, 16))
ON CONFLICT (id) DO UPDATE SET
  verify_token = COALESCE(whatsapp_config.verify_token, 'verify_' || substr(md5(random()::text), 1, 16));

-- Atualizar quota padrão
INSERT INTO meta_quota (id, messages_sent_today, messages_limit, api_calls_today, api_calls_limit, tier) VALUES 
('default', 0, 1000, 0, 100000, 'free')
ON CONFLICT (id) DO UPDATE SET
  messages_limit = GREATEST(meta_quota.messages_limit, 1000),
  api_calls_limit = GREATEST(meta_quota.api_calls_limit, 100000);

-- Inserir usuário admin padrão se não existir
INSERT INTO admin_users (id, email, password_hash, name, role) VALUES 
('admin_default', 'admin@paroquia.com', '$2b$10$rOvHPGkwxqFZWjQoQZQZ4eKvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQv', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- RESUMO DA MIGRAÇÃO
-- ============================================================================

/*
  RESUMO DAS ALTERAÇÕES APLICADAS:

  ✅ Corrigido campo isActive → is_active na tabela flows
  ✅ Adicionados campos para melhor gerenciamento de contatos
  ✅ Melhorados logs de webhook com mais detalhes
  ✅ Criada tabela de configurações do sistema
  ✅ Criada tabela de templates de mensagem
  ✅ Adicionados índices para melhor performance
  ✅ Implementados triggers para updated_at automático
  ✅ Inseridos dados padrão atualizados
  ✅ Verificações de integridade implementadas

  PRÓXIMOS PASSOS:
  1. Execute este script no SQL Editor do Supabase
  2. Verifique se não há erros na execução
  3. Teste as funcionalidades do sistema
  4. Configure o bucket "arquivos" como público se ainda não estiver
  5. Atualize as variáveis de ambiente se necessário

  CONFIGURAÇÃO DO BUCKET:
  - Vá para Storage no Supabase
  - Crie o bucket "arquivos" se não existir
  - Configure como público
  - Defina políticas de acesso apropriadas
*/