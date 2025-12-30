import { useState, useEffect } from 'react';
import {
  notificationsService,
  type NotificationTemplate,
  type CreateTemplateDto,
  type DocumentType,
  type TemplateVariable,
} from '../services/api';
import { Plus, Edit2, Trash2, Copy, X, MessageSquare, Mail, Zap, GripVertical } from 'lucide-react';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'ITP', label: 'ITP' },
  { value: 'RCA', label: 'Asigurare RCA' },
  { value: 'CASCO', label: 'Asigurare CASCO' },
  { value: 'VIGNETTE', label: 'Rovinieta' },
  { value: 'OTHER', label: 'Altele' },
];

const TRIGGER_DAYS_OPTIONS = [
  { value: 30, label: '30 zile inainte' },
  { value: 14, label: '14 zile inainte' },
  { value: 7, label: '7 zile inainte' },
  { value: 3, label: '3 zile inainte' },
  { value: 1, label: '1 zi inainte' },
  { value: 0, label: 'In ziua expirarii' },
  { value: -1, label: '1 zi dupa expirare' },
];

export function TemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const [formData, setFormData] = useState<CreateTemplateDto>({
    name: '',
    description: '',
    type: 'ITP',
    triggerDays: 7,
    smsEnabled: true,
    emailEnabled: false,
    smsContent: '',
    emailSubject: '',
    emailContent: '',
    isDefault: false,
  });

  useEffect(() => {
    loadTemplates();
    loadVariables();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [selectedType]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getTemplates(selectedType || undefined);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariables = async () => {
    try {
      const data = await notificationsService.getTemplateVariables();
      setVariables(data);
    } catch (error) {
      console.error('Error loading variables:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await notificationsService.updateTemplate(editingTemplate.id, formData);
      } else {
        await notificationsService.createTemplate(formData);
      }
      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      triggerDays: template.triggerDays,
      smsEnabled: template.smsEnabled,
      emailEnabled: template.emailEnabled,
      smsContent: template.smsContent || '',
      emailSubject: template.emailSubject || '',
      emailContent: template.emailContent || '',
      isDefault: template.isDefault,
    });
    setShowModal(true);
  };

  const handleDuplicate = (template: NotificationTemplate) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (Copie)`,
      description: template.description || '',
      type: template.type,
      triggerDays: template.triggerDays,
      smsEnabled: template.smsEnabled,
      emailEnabled: template.emailEnabled,
      smsContent: template.smsContent || '',
      emailSubject: template.emailSubject || '',
      emailContent: template.emailContent || '',
      isDefault: false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur doriti sa stergeti acest template?')) return;
    try {
      await notificationsService.deleteTemplate(id);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleToggleActive = async (template: NotificationTemplate) => {
    try {
      await notificationsService.updateTemplate(template.id, { isActive: !template.isActive });
      loadTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Aceasta actiune va crea template-urile implicite. Continuati?')) return;
    try {
      await notificationsService.seedDefaults();
      loadTemplates();
    } catch (error) {
      console.error('Error seeding defaults:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'ITP',
      triggerDays: 7,
      smsEnabled: true,
      emailEnabled: false,
      smsContent: '',
      emailSubject: '',
      emailContent: '',
      isDefault: false,
    });
  };

  const _insertVariable = (variable: string, field: 'smsContent' | 'emailSubject' | 'emailContent') => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] + variable,
    }));
  };
  void _insertVariable; // Keep for future use

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Template-uri Notificari</h1>
          <p className="text-gray-500">Gestioneaza template-urile pentru SMS si Email</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedDefaults}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Zap size={20} />
            Incarca Implicite
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingTemplate(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Template Nou
          </button>
        </div>
      </div>

      {/* Filter by type */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedType === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toate
          </button>
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedType === type.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Se incarca...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">Nu exista template-uri. Creati unul nou sau incarcati template-urile implicite.</p>
          <button
            onClick={handleSeedDefaults}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Incarca Template-uri Implicite
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 ${
                template.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{template.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {DOCUMENT_TYPES.find((t) => t.value === template.type)?.label}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {TRIGGER_DAYS_OPTIONS.find((t) => t.value === template.triggerDays)?.label}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.isActive}
                    onChange={() => handleToggleActive(template)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex gap-2 mb-3">
                {template.smsEnabled && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    <MessageSquare size={12} /> SMS
                  </span>
                )}
                {template.emailEnabled && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    <Mail size={12} /> Email
                  </span>
                )}
                {template.isDefault && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Implicit</span>
                )}
              </div>

              {template.smsContent && (
                <div className="bg-gray-50 rounded p-2 mb-3 text-sm text-gray-600 line-clamp-2">{template.smsContent}</div>
              )}

              <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Duplica"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editeaza"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Sterge"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingTemplate ? 'Editeaza Template' : 'Template Nou'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700 border-b pb-2">Setari Template</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nume Template *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip Document *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as DocumentType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moment Trimitere *</label>
                    <select
                      required
                      value={formData.triggerDays}
                      onChange={(e) => setFormData({ ...formData, triggerDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {TRIGGER_DAYS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.smsEnabled}
                        onChange={(e) => setFormData({ ...formData, smsEnabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Activat SMS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emailEnabled}
                        onChange={(e) => setFormData({ ...formData, emailEnabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Activat Email</span>
                    </label>
                  </div>

                  {/* Variables Panel */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Variabile Disponibile</h4>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-1">
                        {variables.map((v) => (
                          <div
                            key={v.key}
                            className="flex items-center justify-between text-xs p-1.5 bg-white rounded border hover:border-blue-300 cursor-pointer group"
                            onClick={() => navigator.clipboard.writeText(v.key)}
                            title={`${v.description}\nEx: ${v.example}\nClick pentru a copia`}
                          >
                            <code className="text-blue-600 font-mono">{v.key}</code>
                            <GripVertical size={12} className="text-gray-300 group-hover:text-gray-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Click pe variabila pentru a copia</p>
                  </div>
                </div>

                {/* Right column - Content */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-medium text-gray-700 border-b pb-2">Continut Mesaj</h3>

                  {/* SMS Content */}
                  {formData.smsEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Continut SMS
                        <span className="text-gray-400 font-normal ml-2">({formData.smsContent?.length || 0} caractere)</span>
                      </label>
                      <textarea
                        value={formData.smsContent}
                        onChange={(e) => setFormData({ ...formData, smsContent: e.target.value })}
                        rows={4}
                        placeholder="Buna ziua {{client_name}}! Va reamintim ca ITP-ul pentru {{vehicle_plate}} expira pe {{expiry_date}}..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                    </div>
                  )}

                  {/* Email Content */}
                  {formData.emailEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subiect Email</label>
                        <input
                          type="text"
                          value={formData.emailSubject}
                          onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                          placeholder="Reamintire ITP - {{vehicle_plate}}"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Continut Email (HTML)</label>
                        <textarea
                          value={formData.emailContent}
                          onChange={(e) => setFormData({ ...formData, emailContent: e.target.value })}
                          rows={8}
                          placeholder="<p>Stimate {{client_name}},</p><p>Vă reamintim că ITP-ul pentru vehiculul dumneavoastră...</p>"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Preview */}
                  {(formData.smsContent || formData.emailContent) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Previzualizare</h4>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        {formData.smsEnabled && formData.smsContent && (
                          <div className="mb-4">
                            <span className="text-xs font-medium text-gray-500 uppercase">SMS</span>
                            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                              {formData.smsContent
                                .replace(/\{\{client_name\}\}/g, 'Ion Popescu')
                                .replace(/\{\{vehicle_plate\}\}/g, 'B 123 ABC')
                                .replace(/\{\{expiry_date\}\}/g, '15.01.2025')
                                .replace(/\{\{days_remaining\}\}/g, '7')
                                .replace(/\{\{company_name\}\}/g, 'Auto Service SRL')
                                .replace(/\{\{company_phone\}\}/g, '0741234567')}
                            </p>
                          </div>
                        )}
                        {formData.emailEnabled && formData.emailContent && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Email</span>
                            {formData.emailSubject && (
                              <p className="mt-1 font-medium text-gray-800">
                                {formData.emailSubject
                                  .replace(/\{\{vehicle_plate\}\}/g, 'B 123 ABC')
                                  .replace(/\{\{days_remaining\}\}/g, '7')}
                              </p>
                            )}
                            <div
                              className="mt-2 text-sm text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: formData.emailContent
                                  .replace(/\{\{client_name\}\}/g, 'Ion Popescu')
                                  .replace(/\{\{vehicle_plate\}\}/g, 'B 123 ABC')
                                  .replace(/\{\{vehicle_make\}\}/g, 'Dacia')
                                  .replace(/\{\{vehicle_model\}\}/g, 'Logan')
                                  .replace(/\{\{expiry_date\}\}/g, '15.01.2025')
                                  .replace(/\{\{days_remaining\}\}/g, '7')
                                  .replace(/\{\{company_name\}\}/g, 'Auto Service SRL')
                                  .replace(/\{\{company_phone\}\}/g, '0741234567'),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Anuleaza
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTemplate ? 'Salveaza' : 'Creeaza Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
