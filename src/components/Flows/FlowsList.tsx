import React, { useState, useEffect } from 'react';
import { ChatFlow } from '../../types';
import { dbFunctions } from '../../lib/supabase';
import { Plus, Bot, Edit, Trash2, Play, Pause } from 'lucide-react';

interface FlowsListProps {
  onCreateFlow: () => void;
  onEditFlow: (flow: ChatFlow) => void;
}

const FlowsList: React.FC<FlowsListProps> = ({ onCreateFlow, onEditFlow }) => {
  const [flows, setFlows] = useState<ChatFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const data = await dbFunctions.getFlows();
      if (Array.isArray(data)) {
        setFlows(data);
      } else {
        setFlows([]);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlowStatus = async (flowId: string, isActive: boolean) => {
    try {
      const flow = flows.find(f => f.id === flowId);
      if (!flow) return;

      const updatedFlow = { ...flow, is_active: isActive };
      await dbFunctions.saveFlow(updatedFlow);
      setFlows(flows.map(f => f.id === flowId ? updatedFlow : f));
    } catch (error) {
      console.error('Error updating flow status:', error);
    }
  };

  const deleteFlow = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow?')) return;
    
    try {
      await dbFunctions.deleteFlow(flowId);
      setFlows(flows.filter(f => f.id !== flowId));
    } catch (error) {
      console.error('Error deleting flow:', error);
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
          <h2 className="text-2xl font-bold text-gray-800">Fluxos de Atendimento Paroquial</h2>
          <p className="text-gray-600">Crie e gerencie fluxos automatizados para atendimento paroquial</p>
        </div>
        <button
          onClick={onCreateFlow}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Fluxo</span>
        </button>
      </div>

      {flows.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum fluxo paroquial criado</h3>
          <p className="text-gray-500 mb-4">Crie seu primeiro fluxo de atendimento paroquial</p>
          <button
            onClick={onCreateFlow}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Primeiro Fluxo Paroquial</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <div key={flow.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    flow.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Bot className={`w-5 h-5 ${
                      flow.isActive ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{flow.name}</h3>
                    <p className="text-sm text-gray-500">{flow.description || 'Fluxo de atendimento paroquial'}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  flow.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {flow.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{flow.nodes.length} componentes</span>
                  <span>{flow.edges.length} ligações</span>
                </div>
                <button
                  onClick={() => toggleFlowStatus(flow.id, !flow.is_active)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                    flow.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {flow.is_active ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Ativar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEditFlow(flow)}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Editar fluxo paroquial"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deleteFlow(flow.id)}
                  className="flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir fluxo paroquial"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowsList;