import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database functions
export const dbFunctions = {
  // Auth
  async login(email: string, password: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    
    // In a real app, you'd verify the password hash here
    return data;
  },

  async updateLastLogin(userId: string) {
    const { error } = await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Flows
  async getFlows() {
    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async saveFlow(flow: any) {
    // Ensure the correct field name is used
    const flowData = {
      ...flow,
      is_active: flow.is_active !== undefined ? flow.is_active : flow.isActive || false,
      updated_at: new Date().toISOString()
    };
    
    // Remove the old field name if it exists
    delete flowData.isActive;
    
    const { data, error } = await supabase
      .from('flows')
      .upsert(flowData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteFlow(id: string) {
    const { error } = await supabase
      .from('flows')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // WhatsApp Config
  async getWhatsAppConfig() {
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
    
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching WhatsApp config:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('WhatsApp config fetch failed:', error);
      return null;
    }
  },

  async saveWhatsAppConfig(config: any) {
    const webhookUrl = `${window.location.origin}/api/webhook`;
    const { data, error } = await supabase
      .from('whatsapp_config')
      .upsert({
        ...config,
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Messages
  async getMessages(limit = 100) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async saveMessage(message: any) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...message,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Contacts
  async getContacts() {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('last_interaction', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateContact(phone: string, updates: any) {
    const { data, error } = await supabase
      .from('contacts')
      .upsert({ 
        phone, 
        ...updates,
        last_interaction: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Webhook Logs
  async getLogs(limit = 100) {
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async saveLog(log: any) {
    const { data, error } = await supabase
      .from('webhook_logs')
      .insert({
        ...log,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Meta Quota
  async getMetaQuota() {
    try {
      const { data, error } = await supabase
        .from('meta_quota')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
    
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching quota:', error);
        // Create default quota if doesn't exist
        const defaultQuota = {
          id: 'default',
          messages_sent_today: 0,
          messages_limit: 1000,
          api_calls_today: 0,
          api_calls_limit: 100000,
          last_reset: new Date().toISOString(),
          tier: 'free'
        };
      
        try {
          const { data: newData, error: insertError } = await supabase
            .from('meta_quota')
            .insert(defaultQuota)
            .select()
            .single();
      
          if (insertError) {
            console.error('Error creating default quota:', insertError);
            return defaultQuota;
          }
          return newData;
        } catch (insertError) {
          console.error('Failed to create default quota:', insertError);
          return defaultQuota;
        }
      }
    
      return data || {
        id: 'default',
        messages_sent_today: 0,
        messages_limit: 1000,
        api_calls_today: 0,
        api_calls_limit: 100000,
        last_reset: new Date().toISOString(),
        tier: 'free'
      };
    } catch (error) {
      console.error('Meta quota fetch failed:', error);
      return {
        id: 'default',
        messages_sent_today: 0,
        messages_limit: 1000,
        api_calls_today: 0,
        api_calls_limit: 100000,
        last_reset: new Date().toISOString(),
        tier: 'free'
      };
    }
  },

  async updateMetaQuota(updates: any) {
    const { data, error } = await supabase
      .from('meta_quota')
      .upsert({
        id: 'default',
        ...updates
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // File upload
  async uploadFile(file: File, fileName: string) {
    try {
      // First, check if bucket exists and is accessible
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        throw new Error('Storage not accessible');
      }
      
      const arquivosBucket = buckets.find(bucket => bucket.name === 'arquivos');
      if (!arquivosBucket) {
        throw new Error('Bucket "arquivos" not found');
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('arquivos')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
    
      const { data: { publicUrl } } = supabase.storage
        .from('arquivos')
        .getPublicUrl(uniqueFileName);

      return publicUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  },

  // Backup
  async createBackup(type: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${type}-${timestamp}.json`;
    
    let backupData: any = {};
    
    switch (type) {
      case 'full':
        const [flows, messages, contacts, config] = await Promise.all([
          this.getFlows(),
          this.getMessages(1000),
          this.getContacts(),
          this.getWhatsAppConfig()
        ]);
        backupData = { flows, messages, contacts, config };
        break;
      case 'flows':
        backupData = { flows: await this.getFlows() };
        break;
      case 'messages':
        backupData = { messages: await this.getMessages(1000) };
        break;
      case 'contacts':
        backupData = { contacts: await this.getContacts() };
        break;
    }
    
    const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });
    
    const backupFile = new File([backupBlob], fileName, {
      type: 'application/json'
    });
    
    const fileUrl = await this.uploadFile(backupFile, `backups/${fileName}`);
    
    const { data, error } = await supabase
      .from('system_backups')
      .insert({
        id: `backup_${Date.now()}`,
        backup_type: type,
        file_path: fileUrl,
        file_size: backupBlob.size,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBackups() {
    const { data, error } = await supabase
      .from('system_backups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};