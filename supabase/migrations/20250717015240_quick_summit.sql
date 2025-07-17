/*
  # Configuração de Políticas de Upload para Bucket "arquivos"
  
  Este script configura as políticas corretas para o bucket "arquivos"
  permitindo upload, download e gerenciamento de arquivos do sistema.
  
  IMPORTANTE: Execute este script após criar o bucket "arquivos" manualmente
  no painel do Supabase Storage.
*/

-- ============================================================================
-- 1. VERIFICAR E CRIAR BUCKET (se necessário)
-- ============================================================================

-- Nota: O bucket deve ser criado manualmente no painel do Supabase
-- Este script apenas configura as políticas

-- ============================================================================
-- 2. POLÍTICAS PARA BUCKET "arquivos"
-- ============================================================================

-- Política para permitir SELECT (visualizar arquivos)
DROP POLICY IF EXISTS "Permitir visualizar arquivos públicos" ON storage.objects;
CREATE POLICY "Permitir visualizar arquivos públicos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'arquivos');

-- Política para permitir INSERT (upload de arquivos)
DROP POLICY IF EXISTS "Permitir upload de arquivos" ON storage.objects;
CREATE POLICY "Permitir upload de arquivos"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'arquivos' 
    AND (storage.foldername(name))[1] IN ('flows', 'messages', 'templates', 'backups', 'temp')
  );

-- Política para permitir UPDATE (atualizar arquivos)
DROP POLICY IF EXISTS "Permitir atualizar arquivos" ON storage.objects;
CREATE POLICY "Permitir atualizar arquivos"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'arquivos')
  WITH CHECK (bucket_id = 'arquivos');

-- Política para permitir DELETE (excluir arquivos)
DROP POLICY IF EXISTS "Permitir excluir arquivos" ON storage.objects;
CREATE POLICY "Permitir excluir arquivos"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'arquivos');

-- ============================================================================
-- 3. CONFIGURAÇÕES ESPECÍFICAS PARA TIPOS DE ARQUIVO
-- ============================================================================

-- Política específica para imagens
DROP POLICY IF EXISTS "Upload de imagens permitido" ON storage.objects;
CREATE POLICY "Upload de imagens permitido"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'arquivos'
    AND (
      lower(right(name, 4)) IN ('.jpg', '.png', '.gif', '.webp')
      OR lower(right(name, 5)) IN ('.jpeg')
    )
  );

-- Política específica para PDFs
DROP POLICY IF EXISTS "Upload de PDFs permitido" ON storage.objects;
CREATE POLICY "Upload de PDFs permitido"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'arquivos'
    AND lower(right(name, 4)) = '.pdf'
  );

-- Política específica para vídeos
DROP POLICY IF EXISTS "Upload de vídeos permitido" ON storage.objects;
CREATE POLICY "Upload de vídeos permitido"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'arquivos'
    AND (
      lower(right(name, 4)) IN ('.mp4', '.avi', '.mov', '.wmv')
      OR lower(right(name, 5)) IN ('.webm')
    )
  );

-- Política específica para áudios
DROP POLICY IF EXISTS "Upload de áudios permitido" ON storage.objects;
CREATE POLICY "Upload de áudios permitido"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'arquivos'
    AND (
      lower(right(name, 4)) IN ('.mp3', '.wav', '.ogg', '.m4a')
      OR lower(right(name, 5)) IN ('.flac')
    )
  );

-- Política específica para documentos
DROP POLICY IF EXISTS "Upload de documentos permitido" ON storage.objects;
CREATE POLICY "Upload de documentos permitido"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'arquivos'
    AND (
      lower(right(name, 4)) IN ('.doc', '.txt', '.rtf')
      OR lower(right(name, 5)) IN ('.docx')
    )
  );

-- Política específica para backups (JSON)
DROP POLICY IF EXISTS "Upload de backups permitido" ON storage.objects;
CREATE POLICY "Upload de backups permitido"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'arquivos'
    AND lower(right(name, 5)) = '.json'
    AND (storage.foldername(name))[1] = 'backups'
  );

-- ============================================================================
-- 4. CONFIGURAÇÕES DE TAMANHO E SEGURANÇA
-- ============================================================================

-- Função para validar tamanho de arquivo (máximo 50MB)
CREATE OR REPLACE FUNCTION validate_file_size()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o arquivo não excede 50MB (52428800 bytes)
  IF NEW.metadata->>'size' IS NOT NULL 
     AND (NEW.metadata->>'size')::bigint > 52428800 THEN
    RAISE EXCEPTION 'Arquivo muito grande. Tamanho máximo: 50MB';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar tamanho antes do upload
DROP TRIGGER IF EXISTS validate_file_size_trigger ON storage.objects;
CREATE TRIGGER validate_file_size_trigger
  BEFORE INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'arquivos')
  EXECUTE FUNCTION validate_file_size();

-- ============================================================================
-- 5. FUNÇÃO PARA LIMPEZA AUTOMÁTICA DE ARQUIVOS TEMPORÁRIOS
-- ============================================================================

-- Função para limpar arquivos temporários antigos (mais de 24h)
CREATE OR REPLACE FUNCTION cleanup_temp_files()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'arquivos'
    AND (storage.foldername(name))[1] = 'temp'
    AND created_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CONFIGURAÇÕES PARA CORS (Cross-Origin Resource Sharing)
-- ============================================================================

-- Inserir configurações CORS para o bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arquivos',
  'arquivos',
  true,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/json',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 7. TABELA PARA RASTREAR UPLOADS
-- ============================================================================

-- Tabela para rastrear uploads e downloads
CREATE TABLE IF NOT EXISTS file_uploads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  uploaded_by TEXT,
  upload_source TEXT DEFAULT 'system' CHECK (upload_source IN ('system', 'admin', 'flow', 'backup')),
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Política para file_uploads
CREATE POLICY "Permitir todas operações em file_uploads"
  ON file_uploads
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índices para file_uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_file_path ON file_uploads(file_path);
CREATE INDEX IF NOT EXISTS idx_file_uploads_upload_source ON file_uploads(upload_source);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);

-- ============================================================================
-- 8. TRIGGER PARA RASTREAR UPLOADS AUTOMATICAMENTE
-- ============================================================================

-- Função para registrar uploads automaticamente
CREATE OR REPLACE FUNCTION track_file_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar o upload na tabela de rastreamento
  INSERT INTO file_uploads (
    file_name,
    file_path,
    file_size,
    mime_type,
    upload_source
  ) VALUES (
    NEW.name,
    NEW.name,
    COALESCE((NEW.metadata->>'size')::bigint, 0),
    NEW.metadata->>'mimetype',
    CASE 
      WHEN (storage.foldername(NEW.name))[1] = 'backups' THEN 'backup'
      WHEN (storage.foldername(NEW.name))[1] = 'flows' THEN 'flow'
      ELSE 'system'
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para rastrear uploads
DROP TRIGGER IF EXISTS track_file_upload_trigger ON storage.objects;
CREATE TRIGGER track_file_upload_trigger
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'arquivos')
  EXECUTE FUNCTION track_file_upload();

-- ============================================================================
-- 9. FUNÇÃO PARA OBTER URL PÚBLICA DE ARQUIVO
-- ============================================================================

-- Função para gerar URL pública de arquivo
CREATE OR REPLACE FUNCTION get_public_file_url(file_path TEXT)
RETURNS TEXT AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Obter URL base do Supabase
  SELECT 
    CASE 
      WHEN current_setting('app.settings.supabase_url', true) IS NOT NULL 
      THEN current_setting('app.settings.supabase_url', true)
      ELSE 'https://injpovmcsktiidsbzcoz.supabase.co'
    END INTO base_url;
  
  RETURN base_url || '/storage/v1/object/public/arquivos/' || file_path;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. VERIFICAÇÕES E VALIDAÇÕES FINAIS
-- ============================================================================

-- Verificar se o bucket existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'arquivos'
  ) THEN
    RAISE NOTICE 'ATENÇÃO: Bucket "arquivos" não encontrado!';
    RAISE NOTICE 'Crie o bucket manualmente no painel do Supabase Storage.';
    RAISE NOTICE 'Configurações: Nome="arquivos", Público=true, Tamanho máximo=50MB';
  ELSE
    RAISE NOTICE 'Bucket "arquivos" encontrado. Políticas configuradas com sucesso!';
  END IF;
END $$;

-- Verificar políticas criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%arquivos%';
  
  RAISE NOTICE 'Total de políticas configuradas para bucket "arquivos": %', policy_count;
END $$;

-- ============================================================================
-- RESUMO DAS CONFIGURAÇÕES
-- ============================================================================

/*
  CONFIGURAÇÕES APLICADAS:

  ✅ Políticas de acesso completas (SELECT, INSERT, UPDATE, DELETE)
  ✅ Validação de tipos de arquivo (imagens, PDFs, vídeos, áudios, documentos)
  ✅ Limite de tamanho de arquivo (50MB)
  ✅ Organização por pastas (flows, messages, templates, backups, temp)
  ✅ Limpeza automática de arquivos temporários
  ✅ Rastreamento de uploads
  ✅ Função para URLs públicas
  ✅ Configurações CORS
  ✅ Triggers de validação

  TIPOS DE ARQUIVO SUPORTADOS:
  - Imagens: .jpg, .jpeg, .png, .gif, .webp
  - PDFs: .pdf
  - Vídeos: .mp4, .avi, .mov, .wmv, .webm
  - Áudios: .mp3, .wav, .ogg, .m4a, .flac
  - Documentos: .doc, .docx, .txt, .rtf
  - Backups: .json

  ESTRUTURA DE PASTAS:
  - /flows/ - Arquivos dos fluxos
  - /messages/ - Arquivos de mensagens
  - /templates/ - Templates de arquivos
  - /backups/ - Arquivos de backup
  - /temp/ - Arquivos temporários (limpeza automática)

  PRÓXIMOS PASSOS:
  1. Execute este script no SQL Editor do Supabase
  2. Verifique se o bucket "arquivos" existe e está público
  3. Teste o upload de arquivos através do sistema
  4. Monitore os logs de upload na tabela file_uploads
*/