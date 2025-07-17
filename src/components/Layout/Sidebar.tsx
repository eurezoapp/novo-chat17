import React from 'react';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  Settings, 
  BarChart3,
  Smartphone,
  Zap,
  FileText,
  Database,
  LogOut,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, userName }) => {
  const menuItems = [
    { id: 'flows', icon: Bot, label: 'Flows', color: 'text-blue-600' },
    { id: 'messages', icon: MessageSquare, label: 'Mensagens', color: 'text-green-600' },
    { id: 'contacts', icon: Users, label: 'Contatos', color: 'text-purple-600' },
    { id: 'whatsapp', icon: Smartphone, label: 'WhatsApp', color: 'text-emerald-600' },
    { id: 'logs', icon: Activity, label: 'Logs', color: 'text-orange-600' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', color: 'text-indigo-600' },
    { id: 'backup', icon: Database, label: 'Backup', color: 'text-cyan-600' },
    { id: 'settings', icon: Settings, label: 'Configurações', color: 'text-gray-600' }
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Sistema Paroquial</h2>
            <p className="text-sm text-gray-500">Atendimento WhatsApp</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : item.color}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {userName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{userName || 'Admin'}</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;