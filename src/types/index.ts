export interface FlowNode {
  id: string;
  type: 'text' | 'image' | 'pdf' | 'video' | 'template' | 'buttons' | 'condition' | 'webhook';
  position: { x: number; y: number };
  data: {
    label: string;
    content?: string;
    buttons?: ButtonOption[];
    condition?: string;
    variables?: Record<string, any>;
    fileUrl?: string;
    templateId?: string;
    webhookUrl?: string;
    nextNodeId?: string;
  };
}

export interface ButtonOption {
  id: string;
  text: string;
  nextNodeId?: string;
  value?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface ChatFlow {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  is_active: boolean;
  trigger_keywords?: string[];
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConfig {
  id: string;
  phone_number: string;
  access_token: string;
  webhook_url: string;
  verify_token: string;
  is_active: boolean;
  app_id?: string;
  app_secret?: string;
  business_account_id?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'button' | 'template';
  timestamp: string;
  flow_id?: string;
  node_id?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  message_id?: string;
}

export interface Contact {
  id: string;
  phone: string;
  name?: string;
  current_flow?: string;
  current_node?: string;
  variables?: Record<string, any>;
  last_interaction: string;
  conversation_state?: 'active' | 'waiting' | 'completed';
}

export interface WebhookLog {
  id: string;
  type: 'incoming' | 'outgoing' | 'error' | 'webhook';
  method?: string;
  url?: string;
  headers?: Record<string, any>;
  body?: any;
  response?: any;
  status_code?: number;
  error_message?: string;
  timestamp: string;
  phone_number?: string;
}

export interface MetaQuota {
  id: string;
  messages_sent_today: number;
  messages_limit: number;
  api_calls_today: number;
  api_calls_limit: number;
  last_reset: string;
  tier: 'free' | 'basic' | 'standard' | 'unlimited';
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'user';
  last_login?: string;
  created_at: string;
}

export interface ParishConfig {
  id: string;
  parish_name: string;
  parish_address?: string;
  parish_phone?: string;
  parish_email?: string;
  priest_name?: string;
  mass_schedule?: string;
  confession_schedule?: string;
  office_hours?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemBackup {
  id: string;
  backup_type: 'full' | 'flows' | 'messages' | 'contacts';
  file_path: string;
  file_size: number;
  created_at: string;
  status: 'completed' | 'failed' | 'in_progress';
}