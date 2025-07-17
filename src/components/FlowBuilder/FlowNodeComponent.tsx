import React, { useState, useRef } from 'react';
import { FlowNode } from '../../types';
import { MessageSquare, Image, FileText, Video, BookTemplate as Template, MousePointer2, GitBranch, MoreHorizontal, Trash2 } from 'lucide-react';

interface FlowNodeComponentProps {
  node: FlowNode;
  isSelected: boolean;
  onMove: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onClick: () => void;
  onStartConnection: (nodeId: string) => void;
  onCompleteConnection: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  isConnecting: boolean;
  canConnect: boolean;
}

const FlowNodeComponent: React.FC<FlowNodeComponentProps> = ({
  node,
  isSelected,
  onMove,
  onClick,
  onStartConnection,
  onCompleteConnection,
  onDelete,
  isConnecting,
  canConnect
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const getNodeIcon = () => {
    switch (node.type) {
      case 'text': return MessageSquare;
      case 'image': return Image;
      case 'pdf': return FileText;
      case 'video': return Video;
      case 'template': return Template;
      case 'buttons': return MousePointer2;
      case 'condition': return GitBranch;
      default: return MessageSquare;
    }
  };

  const getNodeColor = () => {
    switch (node.type) {
      case 'text': return 'border-blue-300 bg-blue-50';
      case 'image': return 'border-purple-300 bg-purple-50';
      case 'pdf': return 'border-red-300 bg-red-50';
      case 'video': return 'border-indigo-300 bg-indigo-50';
      case 'template': return 'border-cyan-300 bg-cyan-50';
      case 'buttons': return 'border-orange-300 bg-orange-50';
      case 'condition': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!nodeRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !nodeRef.current) return;
    
    const parent = nodeRef.current.parentElement;
    if (!parent) return;
    
    const parentRect = parent.getBoundingClientRect();
    const newX = e.clientX - parentRect.left - dragOffset.x;
    const newY = e.clientY - parentRect.top - dragOffset.y;
    
    onMove(node.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConnectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnecting) {
      onCompleteConnection(node.id);
    } else {
      onStartConnection(node.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este nó?')) {
      onDelete(node.id);
    }
  };
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const Icon = getNodeIcon();

  return (
    <div
      ref={nodeRef}
      className={`absolute w-80 bg-white rounded-lg shadow-lg border-2 cursor-move transition-all ${
        isSelected ? 'border-blue-500 shadow-xl' : `border-gray-200 ${getNodeColor()}`
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)'
      }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getNodeColor()}`}>
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-800">{node.data.label}</h4>
            <p className="text-xs text-gray-500">{node.type}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={handleDeleteClick}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-100 text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4">
        {node.type === 'text' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Message</p>
            <div className="bg-gray-50 rounded p-3 text-sm">
              {node.data.content || 'Digite sua mensagem aqui...'}
            </div>
          </div>
        )}

        {node.type === 'buttons' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Quick Replies Message</p>
            <div className="space-y-2">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm">{node.data.content || 'Selecione uma opção:'}</p>
              </div>
              <div className="space-y-1">
                {(node.data.buttons || []).map((button: any, index: number) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                    {button.text}
                  </div>
                ))}
                {(!node.data.buttons || node.data.buttons.length === 0) && (
                  <div className="bg-gray-100 border border-gray-200 rounded p-2 text-sm text-gray-500">
                    Nenhum botão configurado
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {node.type === 'image' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Image</p>
            <div className="bg-gray-100 rounded p-8 text-center">
              <Image className="w-8 h-8 mx-auto text-gray-400" />
              <p className="text-xs text-gray-500 mt-2">Select image</p>
            </div>
          </div>
        )}

        {node.type === 'pdf' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">PDF Document</p>
            <div className="bg-gray-100 rounded p-8 text-center">
              <FileText className="w-8 h-8 mx-auto text-gray-400" />
              <p className="text-xs text-gray-500 mt-2">Select PDF</p>
            </div>
          </div>
        )}

        {node.type === 'condition' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Condição</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
              <p className="text-sm text-yellow-700">{node.data.condition || 'Configure a condição'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Connection Points */}
      <button
        onClick={handleConnectionClick}
        className={`absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-colors ${
          isConnecting ? 'bg-red-500 hover:bg-red-600' : 
          canConnect ? 'bg-green-500 hover:bg-green-600' : 
          'bg-blue-500 hover:bg-blue-600'
        }`}
        title={isConnecting ? 'Cancelar conexão' : canConnect ? 'Conectar aqui' : 'Iniciar conexão'}
      />
      
      <button
        onClick={handleConnectionClick}
        className={`absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-colors ${
          canConnect ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'
        }`}
        title={canConnect ? 'Conectar aqui' : 'Ponto de entrada'}
        disabled={!canConnect}
      />
    </div>
  );
};

export default FlowNodeComponent;