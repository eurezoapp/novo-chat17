import React, { useState } from 'react';
import { ChatFlow, FlowNode, FlowEdge } from '../../types';
import NodeTypes from './NodeTypes';
import FlowCanvas from './FlowCanvas';
import NodeEditor from './NodeEditor';
import { dbFunctions } from '../../lib/supabase';

interface FlowBuilderProps {
  flow: ChatFlow;
  onSave: (flow: ChatFlow) => void;
  onBack: () => void;
}

const FlowBuilder: React.FC<FlowBuilderProps> = ({ flow, onSave, onBack }) => {
  const [nodes, setNodes] = useState<FlowNode[]>(flow.nodes || []);
  const [edges, setEdges] = useState<FlowEdge[]>(flow.edges || []);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      const updatedFlow = {
        ...flow,
        nodes,
        edges,
        updated_at: new Date().toISOString()
      };
      
      await dbFunctions.saveFlow(updatedFlow);
      onSave(updatedFlow);
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Error saving flow');
    }
  };

  const handleTest = () => {
    alert('Flow test functionality coming soon!');
  };

  const handleNodeUpdate = (updatedNode: FlowNode) => {
    setNodes(nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    ));
    setSelectedNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };
  const handleDragStart = (nodeType: string) => {
    setDraggedNodeType(nodeType);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <NodeTypes onDragStart={handleDragStart} />
      
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        onNodeClick={setSelectedNode}
        selectedNode={selectedNode}
        onSave={handleSave}
        onTest={handleTest}
        onBack={onBack}
        draggedNodeType={draggedNodeType}
        setDraggedNodeType={setDraggedNodeType}
        onDeleteNode={handleDeleteNode}
      />
      
      {selectedNode && (
        <NodeEditor
          node={selectedNode}
          onSave={handleNodeUpdate}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default FlowBuilder;