import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import LoginPage from './components/Auth/LoginPage';
import Sidebar from './components/Layout/Sidebar';
import FlowsList from './components/Flows/FlowsList';
import MessagesList from './components/Messages/MessagesList';
import WhatsAppConfiguration from './components/WhatsApp/WhatsAppConfig';
import FlowBuilder from './components/FlowBuilder/FlowBuilder';
import LogsViewer from './components/Logs/LogsViewer';
import MetaQuotaMonitor from './components/Analytics/MetaQuotaMonitor';
import BackupManager from './components/Backup/BackupManager';
import ParishSettings from './components/Settings/ParishSettings';
import ContactsList from './components/Contacts/ContactsList';
import { ChatFlow, AdminUser } from './types';
import { dbFunctions } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('flows');
  const [currentFlow, setCurrentFlow] = useState<ChatFlow | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('chatbot_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setLoginError(null);
    
    try {
      // Demo credentials
      if (email === 'admin@paroquia.com' && password === 'admin123') {
        const demoUser: AdminUser = {
          id: 'demo_admin',
          email: 'admin@paroquia.com',
          password_hash: '',
          name: 'Administrator',
          role: 'admin',
          created_at: new Date().toISOString()
        };
        
        setUser(demoUser);
        localStorage.setItem('chatbot_user', JSON.stringify(demoUser));
        await dbFunctions.updateLastLogin(demoUser.id);
      } else {
        // Try to authenticate with database
        try {
          const userData = await dbFunctions.login(email, password);
          setUser(userData);
          localStorage.setItem('chatbot_user', JSON.stringify(userData));
          await dbFunctions.updateLastLogin(userData.id);
        } catch (error) {
          setLoginError('Invalid email or password');
        }
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('chatbot_user');
    setActiveTab('flows');
    setShowBuilder(false);
    setCurrentFlow(null);
  };

  const handleCreateFlow = () => {
    const newFlow: ChatFlow = {
      id: `flow_${Date.now()}`,
      name: 'New Flow',
      description: 'Description of the new flow',
      nodes: [],
      edges: [],
      isActive: false,
      trigger_keywords: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCurrentFlow(newFlow);
    setShowBuilder(true);
  };

  const handleEditFlow = (flow: ChatFlow) => {
    setCurrentFlow(flow);
    setShowBuilder(true);
  };

  const handleBackToFlows = () => {
    setShowBuilder(false);
    setCurrentFlow(null);
  };

  const renderContent = () => {
    if (showBuilder && currentFlow) {
      return (
        <FlowBuilder
          flow={currentFlow}
          onSave={(flow) => {
            setCurrentFlow(flow);
            setShowBuilder(false);
          }}
          onBack={handleBackToFlows}
        />
      );
    }

    switch (activeTab) {
      case 'flows':
        return (
          <FlowsList
            onCreateFlow={handleCreateFlow}
            onEditFlow={handleEditFlow}
          />
        );
      case 'messages':
        return <MessagesList />;
      case 'whatsapp':
        return <WhatsAppConfiguration />;
      case 'logs':
        return <LogsViewer />;
      case 'analytics':
        return <MetaQuotaMonitor />;
      case 'backup':
        return <BackupManager />;
      case 'contacts':
        return <ContactsList />;
      case 'settings':
        return <ParishSettings />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loading={loading}
        error={loginError}
      />
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        {!showBuilder && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
            userName={user.name}
          />
        )}
        
        <main className={`flex-1 overflow-auto ${showBuilder ? 'p-0' : 'p-8'}`}>
          {renderContent()}
        </main>
      </div>
    </DndProvider>
  );
};

export default App;