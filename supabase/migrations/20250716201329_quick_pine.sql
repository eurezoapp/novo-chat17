/*
  # Atualização do Sistema Paroquial

  1. Novas Tabelas
    - `parish_info` - Informações da paróquia
    - `liturgical_schedules` - Horários litúrgicos
    - `parish_members` - Membros da paróquia
    - `prayer_requests` - Pedidos de oração
    - `mass_intentions` - Intenções de missa
    - `sacraments` - Registros de sacramentos

  2. Atualizações
    - Tradução de campos para português
    - Novos campos específicos para paróquias
    - Índices para performance

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso apropriadas
*/

-- Tabela de informações da paróquia
CREATE TABLE IF NOT EXISTS parish_info (
  id text PRIMARY KEY DEFAULT 'default',
  nome_paroquia text DEFAULT 'Paróquia São José' NOT NULL,
  endereco text DEFAULT '' NOT NULL,
  cidade text DEFAULT '' NOT NULL,
  cep text DEFAULT '' NOT NULL,
  telefone text DEFAULT '' NOT NULL,
  email text DEFAULT '' NOT NULL,
  nome_paroco text DEFAULT 'Pe. João Silva' NOT NULL,
  diocese text DEFAULT '' NOT NULL,
  cnpj text DEFAULT '' NOT NULL,
  site text DEFAULT '' NOT NULL,
  facebook text DEFAULT '' NOT NULL,
  instagram text DEFAULT '' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE parish_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em parish_info"
  ON parish_info
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Tabela de horários litúrgicos
CREATE TABLE IF NOT EXISTS liturgical_schedules (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tipo text NOT NULL CHECK (tipo IN ('missa', 'confissao', 'adoracao', 'terco', 'novena', 'catequese')),
  dia_semana integer NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 6=sábado
  horario time NOT NULL,
  descricao text DEFAULT '',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE liturgical_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em liturgical_schedules"
  ON liturgical_schedules
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Inserir horários padrão
INSERT INTO liturgical_schedules (tipo, dia_semana, horario, descricao) VALUES
('missa', 0, '07:00', 'Missa Dominical'),
('missa', 0, '09:00', 'Missa Dominical'),
('missa', 0, '19:00', 'Missa Dominical'),
('missa', 6, '19:00', 'Missa Vespertina'),
('confissao', 6, '17:00', 'Confissões'),
('terco', 1, '19:00', 'Terço'),
('terco', 2, '19:00', 'Terço'),
('terco', 3, '19:00', 'Terço'),
('terco', 4, '19:00', 'Terço'),
('terco', 5, '19:00', 'Terço')
ON CONFLICT (id) DO NOTHING;

-- Tabela de membros da paróquia
CREATE TABLE IF NOT EXISTS parish_members (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  telefone text UNIQUE NOT NULL,
  email text DEFAULT '',
  endereco text DEFAULT '',
  data_nascimento date,
  estado_civil text DEFAULT '' CHECK (estado_civil IN ('', 'solteiro', 'casado', 'viuvo', 'divorciado')),
  profissao text DEFAULT '',
  ministerio text DEFAULT '',
  observacoes text DEFAULT '',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE parish_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em parish_members"
  ON parish_members
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_parish_members_telefone ON parish_members(telefone);
CREATE INDEX IF NOT EXISTS idx_parish_members_nome ON parish_members(nome);

-- Tabela de pedidos de oração
CREATE TABLE IF NOT EXISTS prayer_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome_solicitante text NOT NULL,
  telefone text,
  pedido text NOT NULL,
  categoria text DEFAULT 'geral' CHECK (categoria IN ('saude', 'familia', 'trabalho', 'estudos', 'geral', 'agradecimento')),
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'atendido', 'cancelado')),
  privado boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em prayer_requests"
  ON prayer_requests
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_categoria ON prayer_requests(categoria);

-- Tabela de intenções de missa
CREATE TABLE IF NOT EXISTS mass_intentions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome_solicitante text NOT NULL,
  telefone text,
  intencao text NOT NULL,
  data_missa date NOT NULL,
  horario_missa time NOT NULL,
  valor_oferta decimal(10,2) DEFAULT 0,
  status text DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada')),
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mass_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em mass_intentions"
  ON mass_intentions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mass_intentions_data ON mass_intentions(data_missa);
CREATE INDEX IF NOT EXISTS idx_mass_intentions_status ON mass_intentions(status);

-- Tabela de sacramentos
CREATE TABLE IF NOT EXISTS sacraments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tipo text NOT NULL CHECK (tipo IN ('batismo', 'primeira_comunhao', 'crisma', 'casamento', 'uncao')),
  nome_pessoa text NOT NULL,
  data_nascimento date,
  nome_pai text DEFAULT '',
  nome_mae text DEFAULT '',
  data_sacramento date NOT NULL,
  celebrante text DEFAULT '',
  padrinho text DEFAULT '',
  madrinha text DEFAULT '',
  observacoes text DEFAULT '',
  livro_numero text DEFAULT '',
  folha_numero text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sacraments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em sacraments"
  ON sacraments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sacraments_tipo ON sacraments(tipo);
CREATE INDEX IF NOT EXISTS idx_sacraments_data ON sacraments(data_sacramento);
CREATE INDEX IF NOT EXISTS idx_sacraments_nome ON sacraments(nome_pessoa);

-- Atualizar tabela de fluxos com campos em português
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'palavras_chave'
  ) THEN
    ALTER TABLE flows ADD COLUMN palavras_chave jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Atualizar tabela de contatos com campos em português
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'nome'
  ) THEN
    ALTER TABLE contacts ADD COLUMN nome text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'fluxo_atual'
  ) THEN
    ALTER TABLE contacts ADD COLUMN fluxo_atual text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'no_atual'
  ) THEN
    ALTER TABLE contacts ADD COLUMN no_atual text;
  END IF;
END $$;

-- Inserir dados padrão da paróquia
INSERT INTO parish_info (id, nome_paroquia, nome_paroco) VALUES 
('default', 'Paróquia São José', 'Pe. João Silva')
ON CONFLICT (id) DO UPDATE SET
  nome_paroquia = EXCLUDED.nome_paroquia,
  nome_paroco = EXCLUDED.nome_paroco,
  updated_at = now();

-- Inserir configuração padrão do WhatsApp
INSERT INTO whatsapp_config (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Inserir quota padrão
INSERT INTO meta_quota (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;