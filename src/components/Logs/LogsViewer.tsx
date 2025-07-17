import React, { useState, useEffect } from 'react';
import { WebhookLog } from '../../types';
import { dbFunctions } from '../../lib/supabase';
import { Activity, Search, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await dbFunctions.getLogs();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.error_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.phone_number?.includes(searchTerm)
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'outgoing':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'webhook':
        return <Clock className="w-5 h-5 text-purple-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'bg-green-50 border-green-200';
      case 'outgoing':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'webhook':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'text-gray-500';
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
    if (statusCode >= 400) return 'text-red-600';
    return 'text-yellow-600';
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
          <h2 className="text-2xl font-bold text-gray-800">Logs do Sistema</h2>
          <p className="text-gray-600">Monitore chamadas webhook e atividade do sistema paroquial</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No logs yet</h3>
          <p className="text-gray-500">Webhook logs will appear here once activity starts</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getLogColor(log.type)}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getLogIcon(log.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        log.type === 'incoming' ? 'bg-green-100 text-green-800' :
                        log.type === 'outgoing' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      
                      {log.method && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {log.method}
                        </span>
                      )}
                      
                      {log.status_code && (
                        <span className={`text-xs font-medium ${getStatusColor(log.status_code)}`}>
                          {log.status_code}
                        </span>
                      )}
                      
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    
                    {log.url && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600 font-mono truncate">{log.url}</p>
                      </div>
                    )}
                    
                    {log.phone_number && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Phone: </span>
                        <span className="text-sm text-gray-800">{log.phone_number}</span>
                      </div>
                    )}
                    
                    {log.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-700">{log.error_message}</p>
                        </div>
                      </div>
                    )}
                    
                    {log.body && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          View request body
                        </summary>
                        <div className="mt-2 bg-gray-50 rounded-lg p-3">
                          <pre className="text-xs text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.body, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                    
                    {log.response && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          View response
                        </summary>
                        <div className="mt-2 bg-gray-50 rounded-lg p-3">
                          <pre className="text-xs text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.response, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsViewer;