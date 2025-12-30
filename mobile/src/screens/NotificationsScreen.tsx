import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationsService } from '../services/api';

interface NotificationLog {
  id: string;
  channel: 'SMS' | 'EMAIL';
  recipient: string;
  content: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  client?: {
    firstName: string;
    lastName: string;
  };
  document?: {
    type: string;
    expiryDate: string;
  };
}

interface Stats {
  totalDocuments: number;
  expiringDocuments: number;
  expiredDocuments: number;
  todayNotifications: number;
}

export function NotificationsScreen() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [filter, setFilter] = useState<'' | 'SMS' | 'EMAIL'>('');

  const loadData = useCallback(async () => {
    try {
      const [logsData, statsData] = await Promise.all([
        notificationsService.getLogs({ channel: filter || undefined, limit: 50 }),
        notificationsService.getSchedulerStats(),
      ]);
      setLogs(logsData.data);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleRunManualCheck = async () => {
    Alert.alert(
      'Verificare Manuala',
      'Aceasta actiune va verifica toate documentele si va trimite notificari. Continuati?',
      [
        { text: 'Anuleaza', style: 'cancel' },
        {
          text: 'Ruleaza',
          onPress: async () => {
            setRunningCheck(true);
            try {
              await notificationsService.runManualCheck();
              Alert.alert('Succes', 'Verificarea a fost efectuata cu succes!');
              await loadData();
            } catch (error) {
              Alert.alert('Eroare', 'Nu s-a putut efectua verificarea');
            } finally {
              setRunningCheck(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SENT':
        return { icon: 'checkmark-circle', color: '#16a34a', label: 'Trimis' };
      case 'FAILED':
        return { icon: 'close-circle', color: '#dc2626', label: 'Esuat' };
      case 'PENDING':
        return { icon: 'time', color: '#d97706', label: 'In asteptare' };
      default:
        return { icon: 'help-circle', color: '#6b7280', label: status };
    }
  };

  const renderLog = ({ item }: { item: NotificationLog }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.channelContainer}>
            <Ionicons
              name={item.channel === 'SMS' ? 'chatbubble' : 'mail'}
              size={16}
              color={item.channel === 'SMS' ? '#16a34a' : '#1e40af'}
            />
            <Text style={styles.channelText}>{item.channel}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.logBody}>
          <Text style={styles.recipient}>{item.recipient}</Text>
          {item.client && (
            <Text style={styles.clientName}>
              {item.client.firstName} {item.client.lastName}
            </Text>
          )}
          {item.document && (
            <View style={styles.documentInfo}>
              <Text style={styles.documentType}>{item.document.type}</Text>
            </View>
          )}
        </View>

        <View style={styles.logFooter}>
          <View style={styles.statusContainer}>
            <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          {item.errorMessage && (
            <Text style={styles.errorText} numberOfLines={1}>
              {item.errorMessage}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalDocuments}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#d97706' }]}>{stats.expiringDocuments}</Text>
            <Text style={styles.statLabel}>Expira</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.expiredDocuments}</Text>
            <Text style={styles.statLabel}>Expirate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#1e40af' }]}>{stats.todayNotifications}</Text>
            <Text style={styles.statLabel}>Azi</Text>
          </View>
        </View>
      )}

      {/* Manual Check Button */}
      <TouchableOpacity
        style={styles.manualCheckButton}
        onPress={handleRunManualCheck}
        disabled={runningCheck}
      >
        {runningCheck ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="play" size={20} color="#fff" />
        )}
        <Text style={styles.manualCheckText}>
          {runningCheck ? 'Se ruleaza...' : 'Verifica Acum'}
        </Text>
      </TouchableOpacity>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === '' && styles.filterButtonActive]}
          onPress={() => setFilter('')}
        >
          <Text style={[styles.filterText, filter === '' && styles.filterTextActive]}>Toate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'SMS' && styles.filterButtonActive]}
          onPress={() => setFilter('SMS')}
        >
          <Ionicons
            name="chatbubble"
            size={14}
            color={filter === 'SMS' ? '#fff' : '#6b7280'}
          />
          <Text style={[styles.filterText, filter === 'SMS' && styles.filterTextActive]}>SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'EMAIL' && styles.filterButtonActive]}
          onPress={() => setFilter('EMAIL')}
        >
          <Ionicons name="mail" size={14} color={filter === 'EMAIL' ? '#fff' : '#6b7280'} />
          <Text style={[styles.filterText, filter === 'EMAIL' && styles.filterTextActive]}>
            Email
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logs List */}
      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Nu exista notificari in istoric</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLog}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e40af']} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  manualCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  manualCheckText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  logBody: {
    marginBottom: 8,
  },
  recipient: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  clientName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  documentInfo: {
    marginTop: 4,
  },
  documentType: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: '#dc2626',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
