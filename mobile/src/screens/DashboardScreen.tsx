import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsService, notificationsService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  todayAppointments: number;
  weekAppointments: number;
  pendingAppointments: number;
  totalThisMonth: number;
}

interface NotifStats {
  totalDocuments: number;
  expiringDocuments: number;
  expiredDocuments: number;
  todayNotifications: number;
}

export function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifStats, setNotifStats] = useState<NotifStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [appointmentStats, notificationStats] = await Promise.all([
        appointmentsService.getStats(),
        notificationsService.getSchedulerStats(),
      ]);
      setStats(appointmentStats);
      setNotifStats(notificationStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e40af']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Buna ziua,</Text>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <Text style={styles.sectionTitle}>Programari</Text>
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#dbeafe' }]}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Ionicons name="today-outline" size={28} color="#1e40af" />
          <Text style={styles.statValue}>{stats?.todayAppointments || 0}</Text>
          <Text style={styles.statLabel}>Astazi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#fef3c7' }]}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Ionicons name="hourglass-outline" size={28} color="#d97706" />
          <Text style={styles.statValue}>{stats?.pendingAppointments || 0}</Text>
          <Text style={styles.statLabel}>In asteptare</Text>
        </TouchableOpacity>

        <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
          <Ionicons name="calendar-outline" size={28} color="#16a34a" />
          <Text style={styles.statValue}>{stats?.weekAppointments || 0}</Text>
          <Text style={styles.statLabel}>Saptamana</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
          <Ionicons name="stats-chart-outline" size={28} color="#7c3aed" />
          <Text style={styles.statValue}>{stats?.totalThisMonth || 0}</Text>
          <Text style={styles.statLabel}>Luna aceasta</Text>
        </View>
      </View>

      {/* Documents Stats */}
      <Text style={styles.sectionTitle}>Documente</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
          <Ionicons name="document-text-outline" size={28} color="#4338ca" />
          <Text style={styles.statValue}>{notifStats?.totalDocuments || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="warning-outline" size={28} color="#d97706" />
          <Text style={styles.statValue}>{notifStats?.expiringDocuments || 0}</Text>
          <Text style={styles.statLabel}>Expira curand</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="alert-circle-outline" size={28} color="#dc2626" />
          <Text style={styles.statValue}>{notifStats?.expiredDocuments || 0}</Text>
          <Text style={styles.statLabel}>Expirate</Text>
        </View>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#dbeafe' }]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={28} color="#1e40af" />
          <Text style={styles.statValue}>{notifStats?.todayNotifications || 0}</Text>
          <Text style={styles.statLabel}>Notificari azi</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Actiuni rapide</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Ionicons name="calendar" size={24} color="#1e40af" />
          <Text style={styles.actionText}>Programari</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={24} color="#1e40af" />
          <Text style={styles.actionText}>Cauta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications" size={24} color="#1e40af" />
          <Text style={styles.actionText}>Notificari</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#93c5fd',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});
