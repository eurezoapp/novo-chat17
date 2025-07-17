import React from 'react';
import { MessageSquare, Image, FileText, Video, BookTemplate as Template, MousePointer2, GitBranch } from 'lucide-react';

interface NodeTypesProps {
  onDragStart: (nodeType: string) => void;
}

const NodeTypes: React.FC<NodeTypesProps> = ({ onDragStart }) => {
  const nodeTypes = [
    {
      type: 'text',
      icon: MessageSquare, // Adicionado ícone para o tipo 'text'
      label: 'Mensagem',
      description: 'Enviar uma mensagem de texto',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      type: 'image',
      icon: Image,
      label: 'Enviar imagem',
      description: 'Enviar uma imagem', // Adicionado descrição para imagem
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      type: 'pdf',
      icon: FileText,
      label: 'Enviar PDF',
      description: 'Enviar um arquivo PDF', // Adicionado descrição para PDF
      color: 'bg-red-50 border-red-200 text-red-700'
    },
    {
      type: 'video', // Corrigido para 'video'
      icon: Video,
      label: 'Enviar vídeo',
      description: 'Enviar um arquivo de vídeo',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    },
    {
      type: 'template',
      icon: Template, // Adicionado o ícone Template do lucide-react
      label: 'Ação',
      description: 'Executar uma ação ou enviar um template',
      color: 'bg-cyan-50 border-cyan-200 text-cyan-700'
    },
    {
      type: 'delay', // Novo tipo para atraso
      icon: MousePointer2, // Assumiu MousePointer2 para Atraso
      label: 'Atraso',
      description: 'Adicionar um atraso de tempo',
      color: 'bg-green-50 border-green-200 text-green-700' // Nova cor para Atraso
    },
    {
      type: 'question', // Novo tipo para pergunta
      icon: MessageSquare, // Assumiu MessageSquare para Pergunta
      label: 'Pergunta',
      description: 'Fazer uma pergunta com opções',
      color: 'bg-orange-50 border-orange-200 text-orange-700' // Nova cor para Pergunta
    },
    {
      type: 'condition',
      icon: GitBranch,
      label: 'Condição',
      description: 'Ramificar baseado em condições', // Movido para o lugar correto
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700' // Ajustado cor
    },
    {
      type: 'apiCall', // Exemplo: Adicionando um tipo para chamada de API
      icon: GitBranch, // Usando GitBranch, você pode mudar
      label: 'Chamada API',
      description: 'Chamar API externa',
      color: 'bg-gray-50 border-gray-200 text-gray-700'
    }
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Componentes</h3>
        <p className="text-sm text-gray-500">Arraste componentes para o canvas</p>
      </div>

      <div className="p-4 space-y-3">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Eventos</h4>
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Mensagens</h4>
          <div className="space-y-2">
            {nodeTypes.slice(0, 5).map((nodeType) => {
              // Verifica se nodeType.icon existe antes de tentar renderizá-lo
              const Icon = nodeType.icon as React.ElementType;
              if (!Icon) return null; // Não renderiza se não houver ícone
              return (
                <div
                  key={nodeType.type}
                  draggable
                  onDragStart={(e) => {
                    console.log('Drag started:', nodeType.type);
                    onDragStart(nodeType.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 border-dashed cursor-move transition-colors hover:shadow-md ${nodeType.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{nodeType.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Lógica</h4>
          <div className="space-y-2">
            {nodeTypes.slice(5).map((nodeType) => {
              // Verifica se nodeType.icon existe antes de tentar renderizá-lo
              const Icon = nodeType.icon as React.ElementType;
              if (!Icon) return null; // Não renderiza se não houver ícone
              return (
                <div
                  key={nodeType.type}
                  draggable
                  onDragStart={(e) => {
                    console.log('Drag started:', nodeType.type);
                    onDragStart(nodeType.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 border-dashed cursor-move transition-colors hover:shadow-md ${nodeType.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{nodeType.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeTypes;