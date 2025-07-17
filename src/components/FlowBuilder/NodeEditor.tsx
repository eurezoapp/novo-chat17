import React, { useState, useEffect } from 'react';
import { FlowNode, ButtonOption } from '../../types';
import { X, Plus, Upload, Save } from 'lucide-react';
import { dbFunctions } from '../../lib/supabase';

interface NodeEditorProps {
  node: FlowNode | null;
  onSave: (node: FlowNode) => void;
  onClose: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onSave, onClose }) => {
  const [editData, setEditData] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (node) {
      setEditData({ ...node.data });
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    const updatedNode = {
      ...node,
      data: editData
    };
    onSave(updatedNode);
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const fileUrl = await dbFunctions.uploadFile(file, fileName);
      setEditData({ ...editData, fileUrl });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const addButton = () => {
    const newButton: ButtonOption = {
      id: `btn_${Date.now()}`,
      text: 'Nova Opção',
      value: '1'
    };
    setEditData({
      ...editData,
      buttons: [...(editData.buttons || []), newButton]
    });
  };

  const updateButton = (index: number, field: string, value: string) => {
    const updatedButtons = [...(editData.buttons || [])];
    updatedButtons[index] = { ...updatedButtons[index], [field]: value };
    setEditData({ ...editData, buttons: updatedButtons });
  };

  const removeButton = (index: number) => {
    const updatedButtons = (editData.buttons || []).filter((_, i) => i !== index);
    setEditData({ ...editData, buttons: updatedButtons });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit {node.type.charAt(0).toUpperCase()}{node.type.slice(1)} Node
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rótulo
            </label>
            <input
              type="text"
              value={editData.label || ''}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o rótulo do nó"
            />
          </div>

          {/* Text Content */}
          {node.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo
              </label>
              <textarea
                value={editData.content || ''}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Digite o conteúdo do nó"
              />
            </div>
          )}

          {/* Buttons */}
          {node.type === 'buttons' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Mensagem Principal
                </label>
              </div>
              <textarea
                value={editData.content || ''}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                rows={3}
                placeholder="Selecione uma opção:"
              />

              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Botões de Resposta Rápida
                </label>
                <button
                  onClick={addButton}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Botão</span>
                </button>
              </div>

              <div className="space-y-3">
                {(editData.buttons || []).map((button: ButtonOption, index: number) => (
                  <div key={button.id} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => updateButton(index, 'text', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Texto do botão"
                      maxLength={20}
                    />
                    <input
                      type="text"
                      value={button.value || ''}
                      onChange={(e) => updateButton(index, 'value', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ID"
                    />
                    <button
                      onClick={() => removeButton(index)}
                      className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(editData.buttons || []).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Nenhum botão adicionado</p>
                    <p className="text-xs">Clique em "Adicionar Botão" para começar</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Dica:</strong> Máximo de 3 botões por mensagem. Cada botão pode ter até 20 caracteres.
                </p>
              </div>
            </div>
          )}

          {/* Condition */}
          {node.type === 'condition' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condição
              </label>
              <textarea
                value={editData.condition || ''}
                onChange={(e) => setEditData({ ...editData, condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Ex: se contém 'sim' então..."
              />
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>Exemplo:</strong> Use condições simples como "contém 'sim'", "igual a '1'", etc.
                </p>
              </div>
            </div>
          )}

          {/* File Upload */}
          {(node.type === 'image' || node.type === 'pdf' || node.type === 'video') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload {node.type.charAt(0).toUpperCase()}{node.type.slice(1)}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {editData.fileUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">File uploaded successfully!</p>
                    <p className="text-xs text-gray-500">{editData.fileUrl}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  </div>
                )}
                <input
                  type="file"
                  accept={node.type === 'image' ? 'image/*' : node.type === 'pdf' ? '.pdf' : 'video/*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
              </div>
            </div>
          )}

          {/* Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Use variables in your content: {'{'}name{'}'}, {'{'}phone{'}'}, {'{'}time{'}'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isUploading ? 'Enviando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;