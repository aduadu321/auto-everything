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
import { appointmentsService } from '../services/api';

interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  confirmationCode: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'In asteptare', color: '#d97706', bg: '#fef3c7' },
  CONFIRMED: { label: 'Confirmat', color: '#1e40af', bg: '#dbeafe' },
  IN_PROGRESS: { label: 'In desfasurare', color: '#7c3aed', bg: '#f3e8ff' },
  COMPLETED: { label: 'Finalizat', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Anulat', color: '#dc2626', bg: '#fee2e2' },
  NO_SHOW: { label: 'Neprezentare', color: '#6b7280', bg: '#f3f4f6' },
  RAR_BLOCKED: { label: 'Blocat RAR', color: '#ea580c', bg: '#fed7aa' },
};

export function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const data = await appointmentsService.getCalendarData(month, year);
      setAppointments(data.appointments || {});
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const todayAppointments = appointments[formatDate(selectedDate)] || [];

  const handleConfirm = async (id: string) => {
    Alert.alert('Confirma programarea', 'Sunteti sigur ca doriti sa confirmati aceasta programare?', [
      { text: 'Anuleaza', style: 'cancel' },
      {
        text: 'Confirma',
        onPress: async () => {
          setActionLoading(id);
          try {
            await appointmentsService.confirm(id);
            await loadData();
            Alert.alert('Succes', 'Programarea a fost confirmata');
          } catch (error) {
            Alert.alert('Eroare', 'Nu s-a putut confirma programarea');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleQuickAdmis = async (id: string) => {
    Alert.alert('Quick ADMIS', 'Marcati vehiculul ca ADMIS si creati automat documentele ITP?', [
      { text: 'Anuleaza', style: 'cancel' },
      {
        text: 'ADMIS',
        style: 'default',
        onPress: async () => {
          setActionLoading(id);
          try {
            await appointmentsService.quickAdmis(id);
            await loadData();
            Alert.alert('Succes', 'Vehiculul a fost marcat ADMIS');
          } catch (error) {
            Alert.alert('Eroare', 'Nu s-a putut finaliza operatiunea');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleCancel = async (id: string) => {
    Alert.alert('Anuleaza programarea', 'Sunteti sigur?', [
      { text: 'Nu', style: 'cancel' },
      {
        text: 'Da, anuleaza',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(id);
          try {
            await appointmentsService.cancel(id);
            await loadData();
          } catch (error) {
            Alert.alert('Eroare', 'Nu s-a putut anula programarea');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const isLoading = actionLoading === item.id;

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{item.startTime}</Text>
            <Text style={styles.timeSeparator}>-</Text>
            <Text style={styles.time}>{item.endTime}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.appointmentBody}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.vehiclePlate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.clientPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.serviceType}</Text>
          </View>
        </View>

        {/* Actions */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#1e40af" />
          </View>
        ) : (
          <View style={styles.actionsRow}>
            {item.status === 'PENDING' && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.confirmBtn]}
                  onPress={() => handleConfirm(item.id)}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Confirma</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => handleCancel(item.id)}
                >
                  <Ionicons name="close" size={18} color="#dc2626" />
                </TouchableOpacity>
              </>
            )}
            {item.status === 'CONFIRMED' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.admisBtn]}
                onPress={() => handleQuickAdmis(item.id)}
              >
                <Ionicons name="checkmark-done" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>ADMIS</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goToPrevDay} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color="#1e40af" />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('ro-RO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          {formatDate(selectedDate) === formatDate(new Date()) && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>Astazi</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextDay} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color="#1e40af" />
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      {todayAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Nu exista programari pentru aceasta zi</Text>
        </View>
      ) : (
        <FlatList
          data={todayAppointments}
          renderItem={renderAppointment}
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
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navBtn: {
    padding: 8,
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  todayBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  todayText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  timeSeparator: {
    marginHorizontal: 4,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  appointmentBody: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  confirmBtn: {
    backgroundColor: '#1e40af',
    flex: 1,
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
  },
  admisBtn: {
    backgroundColor: '#16a34a',
    flex: 1,
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
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
