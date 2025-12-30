import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  vehiclesService,
  documentsService,
  clientsService,
  notificationsService,
  type Vehicle,
  type Document,
  type Client,
  type CreateVehicleDto,
  type CreateDocumentDto,
  type DocumentType,
} from '../services/api';
import { Plus, Edit2, Trash2, Car, FileText, Send, X, AlertTriangle, CheckCircle } from 'lucide-react';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'ITP', label: 'ITP' },
  { value: 'RCA', label: 'Asigurare RCA' },
  { value: 'CASCO', label: 'Asigurare CASCO' },
  { value: 'VIGNETTE', label: 'Rovinieta' },
  { value: 'OTHER', label: 'Altele' },
];

export function VehiclesPage() {
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('clientId');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>(clientIdFromUrl || '');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Modals
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  // Vehicle Form
  const [vehicleForm, setVehicleForm] = useState<CreateVehicleDto>({
    plateNumber: '',
    make: '',
    model: '',
    year: undefined,
    vin: '',
    clientId: '',
  });

  // Document Form
  const [documentForm, setDocumentForm] = useState<CreateDocumentDto>({
    type: 'ITP',
    issueDate: '',
    expiryDate: '',
    documentNumber: '',
    vehicleId: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadVehicles();
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedVehicle) {
      loadDocuments();
    }
  }, [selectedVehicle]);

  const loadClients = async () => {
    try {
      const data = await clientsService.getAll();
      setClients(data);
      if (clientIdFromUrl && data.find((c) => c.id === clientIdFromUrl)) {
        setSelectedClientId(clientIdFromUrl);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehiclesService.getAll(selectedClientId);
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!selectedVehicle) return;
    try {
      const data = await documentsService.getAll({ vehicleId: selectedVehicle.id });
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // Vehicle CRUD
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = { ...vehicleForm, clientId: selectedClientId };
      if (editingVehicle) {
        await vehiclesService.update(editingVehicle.id, formData);
      } else {
        await vehiclesService.create(formData);
      }
      setShowVehicleModal(false);
      setEditingVehicle(null);
      resetVehicleForm();
      loadVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      plateNumber: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin || '',
      clientId: vehicle.clientId,
    });
    setShowVehicleModal(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Sigur doriti sa stergeti acest vehicul?')) return;
    try {
      await vehiclesService.delete(id);
      setSelectedVehicle(null);
      loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      plateNumber: '',
      make: '',
      model: '',
      year: undefined,
      vin: '',
      clientId: '',
    });
  };

  // Document CRUD
  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const formData = { ...documentForm, vehicleId: selectedVehicle.id };
      if (editingDocument) {
        await documentsService.update(editingDocument.id, formData);
      } else {
        await documentsService.create(formData);
      }
      setShowDocumentModal(false);
      setEditingDocument(null);
      resetDocumentForm();
      loadDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setDocumentForm({
      type: doc.type,
      issueDate: doc.issueDate.split('T')[0],
      expiryDate: doc.expiryDate.split('T')[0],
      documentNumber: doc.documentNumber || '',
      vehicleId: doc.vehicleId,
    });
    setShowDocumentModal(true);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Sigur doriti sa stergeti acest document?')) return;
    try {
      await documentsService.delete(id);
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const resetDocumentForm = () => {
    setDocumentForm({
      type: 'ITP',
      issueDate: '',
      expiryDate: '',
      documentNumber: '',
      vehicleId: '',
    });
  };

  // Send notification
  const handleSendNotification = async (docId: string, channel: 'SMS' | 'EMAIL') => {
    try {
      const result = await notificationsService.sendNotification(docId, channel);
      if (result.success) {
        alert('Notificare trimisa cu succes!');
      } else {
        alert(`Eroare: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Eroare la trimiterea notificarii');
    }
  };

  const _getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'EXPIRING_SOON':
        return <AlertTriangle className="text-yellow-500" size={18} />;
      case 'EXPIRED':
        return <AlertTriangle className="text-red-500" size={18} />;
      default:
        return null;
    }
  };
  void _getStatusIcon; // Keep for future use

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Activ', class: 'bg-green-100 text-green-700' };
      case 'EXPIRING_SOON':
        return { text: 'Expira curand', class: 'bg-yellow-100 text-yellow-700' };
      case 'EXPIRED':
        return { text: 'Expirat', class: 'bg-red-100 text-red-700' };
      case 'RENEWED':
        return { text: 'Reinnoit', class: 'bg-blue-100 text-blue-700' };
      default:
        return { text: status, class: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicule & Documente</h1>
          <p className="text-gray-500">Gestioneaza vehiculele si documentele asociate</p>
        </div>
      </div>

      {/* Client Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecteaza Clientul</label>
        <select
          value={selectedClientId}
          onChange={(e) => {
            setSelectedClientId(e.target.value);
            setSelectedVehicle(null);
          }}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Alege un client --</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName} - {client.phone}
            </option>
          ))}
        </select>
      </div>

      {selectedClientId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicles List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Vehicule</h2>
              <button
                onClick={() => {
                  resetVehicleForm();
                  setEditingVehicle(null);
                  setShowVehicleModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Adauga
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Se incarca...</div>
            ) : vehicles.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nu exista vehicule</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedVehicle?.id === vehicle.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Car className="text-gray-400" size={24} />
                        <div>
                          <div className="font-semibold text-gray-800">{vehicle.plateNumber}</div>
                          <div className="text-sm text-gray-500">
                            {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditVehicle(vehicle);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVehicle(vehicle.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Documente {selectedVehicle && `- ${selectedVehicle.plateNumber}`}
              </h2>
              {selectedVehicle && (
                <button
                  onClick={() => {
                    resetDocumentForm();
                    setEditingDocument(null);
                    setShowDocumentModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Adauga
                </button>
              )}
            </div>

            {!selectedVehicle ? (
              <div className="p-8 text-center text-gray-500">Selecteaza un vehicul pentru a vedea documentele</div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nu exista documente</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {documents.map((doc) => {
                  const statusInfo = getStatusLabel(doc.status);
                  return (
                    <div key={doc.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <FileText className="text-gray-400" size={24} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">
                                {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.class}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Expira: {new Date(doc.expiryDate).toLocaleDateString('ro-RO')}
                            </div>
                            {doc.documentNumber && (
                              <div className="text-xs text-gray-400">Nr: {doc.documentNumber}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSendNotification(doc.id, 'SMS')}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Trimite SMS"
                          >
                            <Send size={16} />
                          </button>
                          <button
                            onClick={() => handleEditDocument(doc)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingVehicle ? 'Editeaza Vehicul' : 'Adauga Vehicul Nou'}
              </h2>
              <button onClick={() => setShowVehicleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numar Inmatriculare *</label>
                <input
                  type="text"
                  required
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value.toUpperCase() })}
                  placeholder="SV 01 ABC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    placeholder="Dacia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    placeholder="Logan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">An Fabricatie</label>
                  <input
                    type="number"
                    value={vehicleForm.year || ''}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) || undefined })}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serie Sasiu (VIN)</label>
                  <input
                    type="text"
                    value={vehicleForm.vin}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Anuleaza
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingVehicle ? 'Salveaza' : 'Adauga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingDocument ? 'Editeaza Document' : 'Adauga Document Nou'}
              </h2>
              <button onClick={() => setShowDocumentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleDocumentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip Document *</label>
                <select
                  required
                  value={documentForm.type}
                  onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value as DocumentType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Emiterii *</label>
                  <input
                    type="date"
                    required
                    value={documentForm.issueDate}
                    onChange={(e) => setDocumentForm({ ...documentForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Expirarii *</label>
                  <input
                    type="date"
                    required
                    value={documentForm.expiryDate}
                    onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numar Document</label>
                <input
                  type="text"
                  value={documentForm.documentNumber}
                  onChange={(e) => setDocumentForm({ ...documentForm, documentNumber: e.target.value })}
                  placeholder="Numar polita / certificat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Anuleaza
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDocument ? 'Salveaza' : 'Adauga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
