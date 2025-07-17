import React, { useState, useEffect } from 'react';
import { WhatsAppConfig } from '../../types';
import { dbFunctions } from '../../lib/supabase';
import { Smartphone, Check, X, ExternalLink, Copy, Globe } from 'lucide-react';

const WhatsAppConfiguration: React.FC = () => {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    loadConfig();
    generateWebhookUrl();
  }, []);

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin;
    const webhook = `${baseUrl}/api/webhook`;
    setWebhookUrl(webhook);
  };

  const loadConfig = async () => {
    try {
      const data = await dbFunctions.getWhatsAppConfig();
      
      if (!data) {
        // Create default config
        const defaultConfig = {
          id: 'default',
          phone_number: '',
          access_token: '',
          webhook_url: webhookUrl,
          verify_token: `verify_${Math.random().toString(36).substring(2, 15)}`,
          is_active: false,
          app_id: '',
          app_secret: '',
          business_account_id: ''
        };
        setConfig(defaultConfig);
      } else {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const updatedConfig = {
        ...config,
        webhook_url: webhookUrl
      };
      await dbFunctions.saveWhatsAppConfig(updatedConfig);
      setConfig(updatedConfig);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config?.access_token || !config?.phone_number) {
      alert('Please fill in access token and phone number first');
      return;
    }

    setTestingConnection(true);
    try {
      // Test WhatsApp API connection
      const response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number}`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`
        }
      });

      if (response.ok) {
        alert('Connection test successful!');
      } else {
        const error = await response.json();
        alert(`Connection test failed: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const generateVerifyToken = () => {
    const newToken = `verify_${Math.random().toString(36).substring(2, 15)}`;
    setConfig({ ...config!, verify_token: newToken });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configuração WhatsApp</h2>
          <p className="text-gray-600">Configure o WhatsApp Business da paróquia</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          config?.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {config?.is_active ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Webhook URL Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Webhook Configuration</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Webhook URL (Auto-generated)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-blue-900 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
          </div>
          
          <div className="bg-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Use this URL in your Meta Developer Console webhook configuration.
              The system automatically generates the correct webhook endpoint based on your domain.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                value={config?.phone_number || ''}
                onChange={(e) => setConfig({ ...config!, phone_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123456789012345"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in Meta Developer Console → WhatsApp → API Setup
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={config?.access_token || ''}
                onChange={(e) => setConfig({ ...config!, access_token: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your permanent access token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate a permanent token in Meta Developer Console
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verify Token
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={config?.verify_token || ''}
                  onChange={(e) => setConfig({ ...config!, verify_token: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter verification token"
                />
                <button
                  onClick={generateVerifyToken}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this token when setting up the webhook in Meta Console
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App ID (Optional)
              </label>
              <input
                type="text"
                value={config?.app_id || ''}
                onChange={(e) => setConfig({ ...config!, app_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your Facebook App ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Account ID (Optional)
              </label>
              <input
                type="text"
                value={config?.business_account_id || ''}
                onChange={(e) => setConfig({ ...config!, business_account_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="WhatsApp Business Account ID"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={config?.is_active || false}
                onChange={(e) => setConfig({ ...config!, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Enable WhatsApp integration
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Setup Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-2">
                <li>1. Create a Meta Developer account</li>
                <li>2. Create a new app with WhatsApp product</li>
                <li>3. Get your Phone Number ID from API Setup</li>
                <li>4. Generate a permanent access token</li>
                <li>5. Configure webhook with the URL above</li>
                <li>6. Add verify token in webhook settings</li>
                <li>7. Test the connection</li>
              </ol>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Important Notes</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Keep your access token secure</li>
                <li>• Webhook must be HTTPS</li>
                <li>• Test thoroughly before going live</li>
                <li>• Monitor message limits</li>
                <li>• Verify webhook subscription</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {testingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
              
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Documentation</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfiguration;