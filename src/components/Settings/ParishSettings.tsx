import React, { useState, useEffect } from 'react';
import { ParishConfig } from '../../types';
import { dbFunctions } from '../../lib/supabase';
import { Church, Save, MapPin, Phone, Mail, User, Clock } from 'lucide-react';

const ParishSettings: React.FC = () => {
  const [config, setConfig] = useState<ParishConfig>({
    id: 'default',
    parish_name: 'Paróquia São José',
    parish_address: '',
    parish_phone: '',
    parish_email: '',
    priest_name: '',
    mass_schedule: '',
    confession_schedule: '',
    office_hours: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [parishInfo, setParishInfo] = useState({
    nome_paroquia: 'Paróquia São José - Padroeiro dos Trabalhadores',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo - SP',
    cep: '01234-567',
    telefone: '(11) 1234-5678',
    email: 'contato@paroquiasaojose.com.br',
    nome_paroco: 'Pe. João da Silva Santos',
    diocese: 'Arquidiocese Metropolitana de São Paulo',
    cnpj: '12.345.678/0001-90',
    site: 'www.paroquiasaojose.com.br',
    facebook: '@paroquiasaojose',
    instagram: '@paroquiasaojose'
  });

  const [schedules, setSchedules] = useState([
    { tipo: 'missa', dia_semana: 0, horario: '07:00', descricao: 'Missa Dominical' },
    { tipo: 'missa', dia_semana: 0, horario: '09:00', descricao: 'Missa Dominical' },
    { tipo: 'missa', dia_semana: 0, horario: '11:00', descricao: 'Missa Dominical' },
    { tipo: 'missa', dia_semana: 0, horario: '19:00', descricao: 'Missa Dominical' },
    { tipo: 'missa', dia_semana: 6, horario: '19:00', descricao: 'Missa Vespertina' },
    { tipo: 'confissao', dia_semana: 6, horario: '16:00', descricao: 'Sacramento da Reconciliação' },
    { tipo: 'confissao', dia_semana: 6, horario: '17:30', descricao: 'Sacramento da Reconciliação' },
    { tipo: 'terco', dia_semana: 1, horario: '19:00', descricao: 'Terço' },
    { tipo: 'terco', dia_semana: 2, horario: '19:00', descricao: 'Terço' },
    { tipo: 'terco', dia_semana: 3, horario: '19:00', descricao: 'Terço' },
    { tipo: 'terco', dia_semana: 4, horario: '19:00', descricao: 'Terço' },
    { tipo: 'terco', dia_semana: 5, horario: '19:00', descricao: 'Terço' },
    { tipo: 'adoracao', dia_semana: 4, horario: '20:00', descricao: 'Adoração ao Santíssimo' },
    { tipo: 'novena', dia_semana: 2, horario: '19:30', descricao: 'Novena Perpétua' }
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real implementation, you would save to database
      localStorage.setItem('parish_config', JSON.stringify(config));
      alert('Configurações da paróquia salvas com sucesso!');
    } catch (error) {
      console.error('Error saving parish config:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Load saved config
    const saved = localStorage.getItem('parish_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configurações da Paróquia</h2>
          <p className="text-gray-600">Configure as informações da sua paróquia</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Church className="w-4 h-4 inline mr-2" />
                Nome da Paróquia
              </label>
              <input
                type="text"
                value={config.parish_name}
                onChange={(e) => setConfig({ ...config, parish_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Paróquia São José"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Endereço
              </label>
              <textarea
                value={config.parish_address || ''}
                onChange={(e) => setConfig({ ...config, parish_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Endereço completo da paróquia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </label>
              <input
                type="tel"
                value={config.parish_phone || ''}
                onChange={(e) => setConfig({ ...config, parish_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={config.parish_email || ''}
                onChange={(e) => setConfig({ ...config, parish_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contato@paroquia.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nome do Pároco
              </label>
              <input
                type="text"
                value={config.priest_name || ''}
                onChange={(e) => setConfig({ ...config, priest_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Pe. João Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horários de Missa
              </label>
              <textarea
                value={config.mass_schedule || ''}
                onChange={(e) => setConfig({ ...config, mass_schedule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Ex: Seg-Sex: 7h e 19h&#10;Sáb: 19h&#10;Dom: 7h, 9h, 19h"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horários de Confissão
              </label>
              <textarea
                value={config.confession_schedule || ''}
                onChange={(e) => setConfig({ ...config, confession_schedule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Ex: Sáb: 17h às 18h30&#10;Dom: 30min antes das missas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horário de Funcionamento da Secretaria
              </label>
              <textarea
                value={config.office_hours || ''}
                onChange={(e) => setConfig({ ...config, office_hours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Ex: Seg-Sex: 8h às 12h e 14h às 17h&#10;Sáb: 8h às 12h"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Preview das Informações</h3>
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h4 className="font-bold text-gray-800">{config.parish_name}</h4>
          {config.parish_address && <p className="text-sm text-gray-600">{config.parish_address}</p>}
          {config.parish_phone && <p className="text-sm text-gray-600">📞 {config.parish_phone}</p>}
          {config.parish_email && <p className="text-sm text-gray-600">✉️ {config.parish_email}</p>}
          {config.priest_name && <p className="text-sm text-gray-600">Pároco: {config.priest_name}</p>}
          {config.mass_schedule && (
            <div className="text-sm text-gray-600">
              <strong>Horários de Missa:</strong>
              <pre className="whitespace-pre-wrap mt-1">{config.mass_schedule}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParishSettings;