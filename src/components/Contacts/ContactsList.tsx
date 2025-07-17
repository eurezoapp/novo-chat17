import React, { useState, useEffect } from 'react';
import { Contact } from '../../types';
import { dbFunctions } from '../../lib/supabase';
import { Users, Plus, Search, MessageSquare, Edit, Trash2, Upload, Download, Phone, User } from 'lucide-react';

const ContactsList: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({
    phone: '',
    name: '',
    variables: {}
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await dbFunctions.getContacts();
      if (Array.isArray(data)) {
        setContacts(data);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  const handleAddContact = async () => {
    if (!newContact.phone.trim()) {
      alert('Telefone é obrigatório');
      return;
    }

    try {
      const contactData = {
        id: `contact_${newContact.phone}`,
        phone: newContact.phone,
        name: newContact.name || null,
        variables: newContact.variables,
        last_interaction: new Date().toISOString(),
        conversation_state: 'active'
      };

      await dbFunctions.updateContact(newContact.phone, contactData);
      await loadContacts();
      setShowAddModal(false);
      setNewContact({ phone: '', name: '', variables: {} });
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Erro ao adicionar contato');
    }
  };

  const handleEditContact = async () => {
    if (!editingContact) return;

    try {
      await dbFunctions.updateContact(editingContact.phone, editingContact);
      await loadContacts();
      setEditingContact(null);
    } catch (error) {
      console.error('Error updating contact:', error);
      alert('Erro ao atualizar contato');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;

    try {
      // In a real implementation, you'd have a delete function
      // For now, we'll just reload the contacts
      await loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Erro ao excluir contato');
    }
  };

  const handleImportContacts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        let importedContacts = [];

        if (file.name.endsWith('.json')) {
          importedContacts = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parsing
          const lines = text.split('\n');
          const headers = lines[0].split(',');
          importedContacts = lines.slice(1).map(line => {
            const values = line.split(',');
            const contact: any = {};
            headers.forEach((header, index) => {
              contact[header.trim()] = values[index]?.trim();
            });
            return contact;
          });
        }

        // Process imported contacts
        for (const contact of importedContacts) {
          if (contact.phone) {
            await dbFunctions.updateContact(contact.phone, {
              id: `contact_${contact.phone}`,
              phone: contact.phone,
              name: contact.name || null,
              variables: contact.variables || {},
              last_interaction: new Date().toISOString(),
              conversation_state: 'active'
            });
          }
        }

        await loadContacts();
        alert(`${importedContacts.length} contatos importados com sucesso!`);
      } catch (error) {
        console.error('Error importing contacts:', error);
        alert('Erro ao importar contatos');
      }
    };
    input.click();
  };

  const handleExportContacts = () => {
    const dataStr = JSON.stringify(contacts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contatos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatPhone = (phone: string) => {
    // Format Brazilian phone number
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatLastInteraction = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
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
          <h2 className="text-2xl font-bold text-gray-800">Contatos</h2>
          <p className="text-gray-600">Gerencie os contatos da paróquia</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleImportContacts}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Importar</span>
          </button>
          <button
            onClick={handleExportContacts}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar contatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
        />
      </div>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {contacts.length === 0 ? 'Nenhum contato cadastrado' : 'Nenhum contato encontrado'}
          </h3>
          <p className="text-gray-500 mb-4">
            {contacts.length === 0 
              ? 'Adicione seu primeiro contato para começar' 
              : 'Tente ajustar os termos de busca'}
          </p>
          {contacts.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeiro Contato</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {contact.name || 'Sem nome'}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Phone className="w-4 h-4" />
                        <span>{formatPhone(contact.phone)}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Última interação: {formatLastInteraction(contact.last_interaction)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contact.conversation_state === 'active' ? 'bg-green-100 text-green-800' :
                      contact.conversation_state === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {contact.conversation_state === 'active' ? 'Ativo' :
                       contact.conversation_state === 'waiting' ? 'Aguardando' : 'Finalizado'}
                    </div>
                    
                    <button
                      onClick={() => alert('Funcionalidade de conversa em desenvolvimento')}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Conversar</span>
                    </button>
                    
                    <button
                      onClick={() => setEditingContact(contact)}
                      className="flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Novo Contato</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <span className="text-gray-400">×</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome do contato"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddContact}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Editar Contato</h2>
              <button
                onClick={() => setEditingContact(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <span className="text-gray-400">×</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={editingContact.phone}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={editingContact.name || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome do contato"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingContact(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditContact}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsList;