# Sistema Paroquial - Atendimento WhatsApp

Um sistema completo e profissional para secretarias paroquiais gerenciarem atendimento automatizado no WhatsApp Business com interface visual de flow-maker.

## 🚀 Características Principais

### ✨ Flow-maker Visual
- Interface drag & drop intuitiva
- Componentes para texto, imagem, PDF, vídeo, botões e condições específicos para atendimento paroquial
- Sistema de conexões visuais entre nós
- Preview em tempo real dos flows

### 🔧 Integração WhatsApp Business
- Configuração automática de webhook
- Suporte completo à API do WhatsApp Business
- Processamento de mensagens paroquiais em tempo real
- Sistema de numeração automática para respostas

### 📊 Monitoramento e Analytics
- Dashboard de mensagens enviadas/recebidas
- Contador de recursos gratuitos da META
- Logs detalhados de conexões e erros
- Monitor de quota da API

### 🔐 Sistema de Autenticação
- Login seguro para administradores
- Controle de acesso baseado em roles
- Sessões persistentes

### 💾 Backup e Restauração
- Backup automático de todos os dados paroquiais
- Exportação de flows, mensagens e contatos
- Sistema de restauração para novas instalações
- Arquivos JSON estruturados

## 🛠️ Instalação

### Pré-requisitos
- Conta no Supabase
- Conta no Meta Developer (WhatsApp Business)
- Node.js 18+ e npm

### 1. Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Execute o script de migração em SQL Editor:
```sql
-- Cole o conteúdo do arquivo supabase/migrations/create_complete_chatbot_system.sql
```
3. Crie um bucket público chamado "arquivos" no Storage
4. Configure as variáveis de ambiente

### 2. Configuração do Projeto

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env`:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 3. Deploy

#### Netlify (Recomendado)
1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente no painel do Netlify
3. O deploy será automático

#### Vercel
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Adicione redirecionamento em `vercel.json`

### 4. Configuração do WhatsApp Business

1. Acesse o [Meta Developer Console](https://developers.facebook.com)
2. Crie um novo app com produto WhatsApp
3. Configure o webhook com a URL: `https://seu-dominio.com/api/webhook`
4. Use o token de verificação gerado no sistema
5. Configure as permissões necessárias

## 📱 Como Usar

### Login
- Email: `admin@paroquia.com`
- Senha: `admin123`

### Criando um Fluxo de Atendimento
1. Acesse a aba "Flows"
2. Clique em "Criar Fluxo"
3. Arraste componentes da sidebar para o canvas
4. Configure cada nó clicando nele
5. Conecte os nós arrastando das bolinhas de conexão
6. Salve o flow

### Configurando WhatsApp da Paróquia
1. Acesse a aba "WhatsApp"
2. Insira o Phone Number ID
3. Adicione o Access Token permanente
4. Configure o Verify Token
5. Teste a conexão
6. Ative a integração

### Monitoramento
- **Mensagens**: Visualize todas as conversas
- **Logs**: Monitore chamadas de webhook e erros
- **Analytics**: Acompanhe uso da quota da META
- **Backup**: Crie backups regulares dos dados

## 🔧 Funcionalidades Técnicas

### Webhook Automático
- URL gerada automaticamente: `https://seu-dominio.com/api/webhook`
- Processamento em tempo real de mensagens
- Suporte a diferentes tipos de mensagem
- Sistema de retry para falhas

### Sistema de Flows
- Execução baseada em palavras-chave
- Lógica condicional avançada
- Variáveis dinâmicas
- Estados de conversa persistentes

### Banco de Dados
- PostgreSQL via Supabase
- Row Level Security (RLS)
- Backup automático
- Migrações versionadas

### Segurança
- Autenticação JWT
- Tokens de verificação únicos
- CORS configurado
- Rate limiting

## 📊 Estrutura do Banco

### Tabelas Principais
- `flows` - Fluxos de conversa
- `messages` - Histórico de mensagens
- `contacts` - Contatos e estados
- `whatsapp_config` - Configurações da API
- `webhook_logs` - Logs do sistema
- `meta_quota` - Controle de quota
- `admin_users` - Usuários do sistema
- `system_backups` - Backups

## 🚀 Deploy em Produção

### Configurações Recomendadas
- SSL/HTTPS obrigatório
- Variáveis de ambiente seguras
- Backup automático diário
- Monitoramento de logs
- Rate limiting configurado

### Escalabilidade
- Suporte a múltiplos flows simultâneos
- Cache de configurações
- Processamento assíncrono
- Otimização de queries

## 🔄 Migração para Nova Conta

1. Faça backup completo dos dados
2. Configure nova instância do Supabase
3. Execute as migrações
4. Importe o backup
5. Reconfigure webhooks no Meta Console
6. Teste todas as funcionalidades

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Verifique os logs do sistema
- Consulte a documentação da Meta
- Teste a conectividade do webhook
- Monitore a quota da API

## 📄 Licença

Este projeto é proprietário e destinado ao uso comercial. Todos os direitos reservados.

---

**Desenvolvido com ❤️ por [Sem. Guthierres Cavalcante](https://instagram.com/guthierresc) para Secretarias Paroquiais**