import { useState, useEffect } from 'react';
import { notificationsService, type NotificationLog } from '../services/api';
import { MessageSquare, Mail, CheckCircle, XCircle, Clock, RefreshCw, Play } from 'lucide-react';

export function NotificationsLogsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [runningCheck, setRunningCheck] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    channel: '',
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [pagination.page, filters.channel]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await notificationsService.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        channel: filters.channel || undefined,
      });
      setLogs(result.data);
      setPagination((prev) => ({
        ...prev,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      }));
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await notificationsService.getSchedulerStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRunManualCheck = async () => {
    if (!confirm('Aceasta actiune va verifica toate documentele si va trimite notificari. Continuati?')) return;
    try {
      setRunningCheck(true);
      await notificationsService.runManualCheck();
      alert('Verificare manuala efectuata cu succes!');
      loadLogs();
      loadStats();
    } catch (error) {
      console.error('Error running manual check:', error);
      alert('Eroare la efectuarea verificarii');
    } finally {
      setRunningCheck(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'FAILED':
        return <XCircle className="text-red-500" size={18} />;
      case 'PENDING':
        return <Clock className="text-yellow-500" size={18} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT':
        return { text: 'Trimis', class: 'bg-green-100 text-green-700' };
      case 'FAILED':
        return { text: 'Esuat', class: 'bg-red-100 text-red-700' };
      case 'PENDING':
        return { text: 'In asteptare', class: 'bg-yellow-100 text-yellow-700' };
      default:
        return { text: status, class: 'bg-gray-100 text-gray-700' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Istoric Notificari</h1>
          <p className="text-gray-500">Vizualizati toate notificarile trimise</p>
        </div>
        <button
          onClick={handleRunManualCheck}
          disabled={runningCheck}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {runningCheck ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
          {runningCheck ? 'Se ruleaza...' : 'Verifica Acum'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Documente</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalDocuments}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Expira in 30 zile</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringDocuments}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Expirate</div>
            <div className="text-2xl font-bold text-red-600">{stats.expiredDocuments}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Notificari Azi</div>
            <div className="text-2xl font-bold text-blue-600">{stats.todayNotifications}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ ...filters, channel: '' })}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.channel === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toate
            </button>
            <button
              onClick={() => setFilters({ ...filters, channel: 'SMS' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filters.channel === 'SMS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare size={16} /> SMS
            </button>
            <button
              onClick={() => setFilters({ ...filters, channel: 'EMAIL' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filters.channel === 'EMAIL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail size={16} /> Email
            </button>
          </div>

          <button
            onClick={loadLogs}
            className="ml-auto p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Reincarca"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Se incarca...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nu exista notificari in istoric</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Data</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Canal</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Destinatar</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Client</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Document</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Mesaj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => {
                  const statusInfo = getStatusLabel(log.status);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(log.createdAt)}</td>
                      <td className="px-6 py-4">
                        {log.channel === 'SMS' ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <MessageSquare size={16} /> SMS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Mail size={16} /> Email
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{log.recipient}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {log.client ? `${log.client.firstName} ${log.client.lastName}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.document ? (
                          <div>
                            <span className="font-medium">{log.document.type}</span>
                            <span className="text-gray-400 ml-2">
                              {new Date(log.document.expiryDate).toLocaleDateString('ro-RO')}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.class}`}>{statusInfo.text}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.content}>
                        {log.errorMessage ? (
                          <span className="text-red-600">{log.errorMessage}</span>
                        ) : (
                          log.content.substring(0, 50) + (log.content.length > 50 ? '...' : '')
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Afisez {(pagination.page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} din {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-gray-600">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Urmator
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
