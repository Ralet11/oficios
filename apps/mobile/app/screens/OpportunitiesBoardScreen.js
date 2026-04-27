const React = require('react');
const { useState, useEffect, useCallback } = React;
const {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Image,
} = require('react-native');
const { useNavigation } = require('@react-navigation/native');
const { StatusBadge } = require('../components/StatusBadge');
const api = require('../services/api');
const { EmptyState } = require('../components/EmptyState');
const { ServiceArtwork } = require('../components/ServiceArtwork');

function OpportunitiesBoardScreen() {
  const navigation = useNavigation();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get('/service-needs/opportunities');
      setOpportunities(data.data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar oportunidades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpportunities();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OpportunityDetail', { needId: item.id })}
    >
      {item.photoUrls && item.photoUrls.length > 0 ? (
        <Image source={{ uri: item.photoUrls[0] }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <ServiceArtwork name="tool" size={40} color="#ccc" />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title || 'Sin título'}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description || 'Sin descripción'}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardCategory}>
            {item.category?.name || 'Sin categoría'}
          </Text>
          {item.city && <Text style={styles.cardLocation}>{item.city}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tablero de Oportunidades</Text>
      </View>
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={opportunities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={opportunities.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={<EmptyState title="No hay oportunidades" message="No hay necesidades publicadas en el tablero todavía." />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  cardLocation: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

module.exports = { OpportunitiesBoardScreen };
