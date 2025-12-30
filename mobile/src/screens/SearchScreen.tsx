import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsService } from '../services/api';

interface SearchResult {
  id: string;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'In asteptare', color: '#d97706', bg: '#fef3c7' },
  CONFIRMED: { label: 'Confirmat', color: '#1e40af', bg: '#dbeafe' },
  IN_PROGRESS: { label: 'In desfasurare', color: '#7c3aed', bg: '#f3e8ff' },
  COMPLETED: { label: 'Finalizat', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Anulat', color: '#dc2626', bg: '#fee2e2' },
  NO_SHOW: { label: 'Neprezentare', color: '#6b7280', bg: '#f3f4f6' },
};

export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (query.length < 2) {
      Alert.alert('Atentie', 'Introduceti minim 2 caractere');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const data = await appointmentsService.searchUnified(query);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Eroare', 'Nu s-a putut efectua cautarea');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;

    return (
      <TouchableOpacity style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.resultBody}>
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.vehiclePlate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.clientPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              {formatDate(item.appointmentDate)} - {item.startTime}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.serviceType}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Cauta dupa nume, telefon sau nr. auto..."
            placeholderTextColor="#9ca3af"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Cauta</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : results.length === 0 && searched ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Nu au fost gasite rezultate</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Cautati dupa nume client, telefon sau numar de inmatriculare</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  searchButton: {
    backgroundColor: '#1e40af',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  centerContainer: {
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
  listContent: {
    padding: 16,
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
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
  resultBody: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
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
});
