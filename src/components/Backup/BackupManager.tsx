import React, { useState, useEffect } from 'react';
import { SystemBackup } from '../../types';
import { dbFunctions } from '../../lib/supabase';
import { Database, Download, Upload, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';

const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const data = await dbFunctions.getBackups();
      if (Array.isArray(data)) {
        setBackups(data);
      } else {
        setBackups([]);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: string) => {
    setCreating(true);
    try {
      await dbFunctions.createBackup(type);
      await loadBackups();
      alert('Backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup');
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = (backup: SystemBackup) => {
    window.open(backup.file_path, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-blue-100 text-blue-800';
      case 'flows': return 'bg-green-100 text-green-800';
      case 'messages': return 'bg-purple-100 text-purple-800';
      case 'contacts': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
    }
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
          <h2 className="text-2xl font-bold text-gray-800">Gerenciador de Backup</h2>
          <p className="text-gray-600">Crie e gerencie backups dos dados paroquiais</p>
        </div>
      </div>

      {/* Create Backup Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Backup</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => createBackup('full')}
            disabled={creating}
            className="flex flex-col items-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <Database className="w-8 h-8 text-blue-600 mb-2" />
            <span className="font-medium text-blue-800">Full Backup</span>
            <span className="text-sm text-blue-600">All data</span>
          </button>

          <button
            onClick={() => createBackup('flows')}
            disabled={creating}
            className="flex flex-col items-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <Database className="w-8 h-8 text-green-600 mb-2" />
            <span className="font-medium text-green-800">Flows Only</span>
            <span className="text-sm text-green-600">Chat flows</span>
          </button>

          <button
            onClick={() => createBackup('messages')}
            disabled={creating}
            className="flex flex-col items-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
          >
            <Database className="w-8 h-8 text-purple-600 mb-2" />
            <span className="font-medium text-purple-800">Messages Only</span>
            <span className="text-sm text-purple-600">Chat history</span>
          </button>

          <button
            onClick={() => createBackup('contacts')}
            disabled={creating}
            className="flex flex-col items-center p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            <Database className="w-8 h-8 text-orange-600 mb-2" />
            <span className="font-medium text-orange-800">Contacts Only</span>
            <span className="text-sm text-orange-600">Contact data</span>
          </button>
        </div>

        {creating && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-blue-700">Creating backup...</span>
            </div>
          </div>
        )}
      </div>

      {/* Backup List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Backup History</h3>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No backups yet</h3>
            <p className="text-gray-500">Create your first backup to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {backups.map((backup) => (
              <div key={backup.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-800">
                          {backup.backup_type.charAt(0).toUpperCase() + backup.backup_type.slice(1)} Backup
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBackupTypeColor(backup.backup_type)}`}>
                          {backup.backup_type}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(backup.created_at)}</span>
                        <span>{formatFileSize(backup.file_size)}</span>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(backup.status)}
                          <span className="capitalize">{backup.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {backup.status === 'completed' && (
                      <button
                        onClick={() => downloadBackup(backup)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    )}
                    
                    <button className="flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Installation Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Installation Instructions</h3>
        <div className="space-y-3 text-sm text-yellow-800">
          <p><strong>To install in a new account:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Create a new Supabase project</li>
            <li>Run the database migration scripts</li>
            <li>Upload the backup file to the new project</li>
            <li>Import the backup data using the restore function</li>
            <li>Configure WhatsApp Business API credentials</li>
            <li>Update webhook URLs in Meta Developer Console</li>
          </ol>
          <p className="mt-4"><strong>Note:</strong> Full backups include all flows, messages, contacts, and configuration data.</p>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;