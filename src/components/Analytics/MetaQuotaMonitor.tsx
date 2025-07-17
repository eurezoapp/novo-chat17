import React, { useState, useEffect } from 'react';
import { MetaQuota } from '../../types';
import { dbFunctions } from '../../lib/supabase';
import { MessageSquare, Zap, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

const MetaQuotaMonitor: React.FC = () => {
  const [quota, setQuota] = useState<MetaQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuota();
    const interval = setInterval(loadQuota, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQuota = async () => {
    try {
      const data = await dbFunctions.getMetaQuota();
      if (data) {
        setQuota(data);
      }
    } catch (error) {
      console.error('Error loading quota:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetQuota = async () => {
    if (!quota) return;
    
    try {
      const today = new Date().toDateString();
      const lastReset = new Date(quota.last_reset).toDateString();
      
      if (today !== lastReset) {
        await dbFunctions.updateMetaQuota({
          messages_sent_today: 0,
          api_calls_today: 0,
          last_reset: new Date().toISOString()
        });
        loadQuota();
      }
    } catch (error) {
      console.error('Error resetting quota:', error);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">Quota data not available</h3>
        <p className="text-gray-500">Unable to load Meta API quota information</p>
      </div>
    );
  }

  const messageUsage = getUsagePercentage(quota.messages_sent_today, quota.messages_limit);
  const apiUsage = getUsagePercentage(quota.api_calls_today, quota.api_calls_limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Monitoramento de Quota</h2>
          <p className="text-gray-600">Monitore o uso da API do WhatsApp da paróquia</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={resetQuota}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Daily</span>
          </button>
          <button
            onClick={loadQuota}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Messages Quota */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Messages Sent</h3>
                <p className="text-sm text-gray-500">Daily limit</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              quota.tier === 'free' ? 'bg-gray-100 text-gray-800' :
              quota.tier === 'basic' ? 'bg-blue-100 text-blue-800' :
              quota.tier === 'standard' ? 'bg-purple-100 text-purple-800' :
              'bg-gold-100 text-gold-800'
            }`}>
              {quota.tier.charAt(0).toUpperCase() + quota.tier.slice(1)}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-800">
                {quota.messages_sent_today.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">
                of {quota.messages_limit.toLocaleString()}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getUsageColor(messageUsage)}`}
                style={{ width: `${messageUsage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${getTextColor(messageUsage)}`}>
                {messageUsage.toFixed(1)}% used
              </span>
              <span className="text-gray-500">
                {(quota.messages_limit - quota.messages_sent_today).toLocaleString()} remaining
              </span>
            </div>

            {messageUsage >= 90 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 font-medium">
                    Quota almost exhausted!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Calls Quota */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">API Calls</h3>
                <p className="text-sm text-gray-500">Daily limit</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-800">
                {quota.api_calls_today.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">
                of {quota.api_calls_limit.toLocaleString()}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getUsageColor(apiUsage)}`}
                style={{ width: `${apiUsage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${getTextColor(apiUsage)}`}>
                {apiUsage.toFixed(1)}% used
              </span>
              <span className="text-gray-500">
                {(quota.api_calls_limit - quota.api_calls_today).toLocaleString()} remaining
              </span>
            </div>

            {apiUsage >= 90 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 font-medium">
                    API limit almost reached!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Usage Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Optimize Message Usage:</h4>
            <ul className="space-y-1">
              <li>• Use templates for common responses</li>
              <li>• Implement smart flow logic to reduce redundant messages</li>
              <li>• Monitor peak usage times</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">API Call Optimization:</h4>
            <ul className="space-y-1">
              <li>• Batch operations when possible</li>
              <li>• Cache frequently accessed data</li>
              <li>• Use webhooks efficiently</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Last Reset Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Last quota reset: {new Date(quota.last_reset).toLocaleString('pt-BR')}</span>
          <span>Next reset: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')} 00:00</span>
        </div>
      </div>
    </div>
  );
};

export default MetaQuotaMonitor;