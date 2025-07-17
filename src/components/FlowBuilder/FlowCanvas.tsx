import React, { useState, useCallback, useRef } from 'react';
import { FlowNode, FlowEdge } from '../../types';
import FlowNodeComponent from './FlowNodeComponent';
import { Plus, Save, Play, ArrowLeft } from 'lucide-react';

interface FlowCanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (nodes: FlowNode[]) => void;
  onEdgesChange: (edges: FlowEdge[]) => void;
  onNodeClick: (node: FlowNode) => void;
  selectedNode: FlowNode | null;
  onSave: () => void;
  onTest: () => void;
  onBack: () => void;
  draggedNodeType?: string | null;
  setDraggedNodeType?: (type: string | null) => void;
  onDeleteNode?: (nodeId: string) => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  selectedNode,
  onSave,
  onTest,
  onBack,
  draggedNodeType: externalDraggedNodeType,
  setDraggedNodeType: setExternalDraggedNodeType,
  onDeleteNode
}) => {
  const [internalDraggedNodeType, setInternalDraggedNodeType] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Use external draggedNodeType if provided, otherwise use internal
  const draggedNodeType = externalDraggedNodeType !== undefined ? externalDraggedNodeType : internalDraggedNodeType;
  const setDraggedNodeType = setExternalDraggedNodeType || setInternalDraggedNodeType;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedNodeType || !canvasRef.current) {
      console.log('Drop failed: missing draggedNodeType or canvasRef');
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type: draggedNodeType as any,
      position: { x, y },
      data: {
        label: `${draggedNodeType.charAt(0).toUpperCase()}${draggedNodeType.slice(1)} Node`,
        content: '',
        buttons: [],
        variables: {}
      }
    };
    
    onNodesChange([...nodes, newNode]);
    console.log('Node added:', newNode);
    setDraggedNodeType(null);
  }, [draggedNodeType, nodes, onNodesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleNodeMove = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    const updatedNodes = nodes.map(node =>
      node.id === nodeId ? { ...node, position: newPosition } : node
    );
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange]);

  const handleNodeConnect = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) return; // Prevent self-connection
    
    // Check if connection already exists
    const existingEdge = edges.find(edge => edge.source === sourceId && edge.target === targetId);
    if (existingEdge) return;
    
    const newEdge: FlowEdge = {
      id: `edge_${Date.now()}`,
      source: sourceId,
      target: targetId
    };
    onEdgesChange([...edges, newEdge]);
  }, [edges, onEdgesChange]);

  const handleStartConnection = useCallback((nodeId: string) => {
    setConnectingFrom(nodeId);
  }, []);

  const handleCompleteConnection = useCallback((targetId: string) => {
    if (connectingFrom && connectingFrom !== targetId) {
      handleNodeConnect(connectingFrom, targetId);
    }
    setConnectingFrom(null);
  }, [connectingFrom, handleNodeConnect]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (onDeleteNode) {
      onDeleteNode(nodeId);
    }
  }, [onDeleteNode]);
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <h2 className="text-xl font-semibold text-gray-800">Construtor de Fluxos</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onTest}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Testar Fluxo</span>
          </button>
          <button
            onClick={onSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 bg-gray-50 relative overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ 
          backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      >
        {/* Render connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            const x1 = sourceNode.position.x + 150;
            const y1 = sourceNode.position.y + 50;
            const x2 = targetNode.position.x + 150;
            const y2 = targetNode.position.y + 50;
            
            return (
              <line
                key={edge.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6366f1"
              />
            </marker>
          </defs>
        </svg>

        {/* Render nodes */}
        {nodes.map((node) => (
          <FlowNodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            onMove={handleNodeMove}
            onClick={() => onNodeClick(node)}
            onStartConnection={handleStartConnection}
            onCompleteConnection={handleCompleteConnection}
            onDelete={handleDeleteNode}
            isConnecting={connectingFrom === node.id}
            canConnect={connectingFrom !== null && connectingFrom !== node.id}
          />
        ))}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Crie seu primeiro fluxo</h3>
              <p className="text-gray-500">Arraste componentes da barra lateral para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowCanvas;