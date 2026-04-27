const React = require('react');
const { useState, useEffect } = React;
const {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Image,
  Alert,
} = require('react-native');
const { useRoute, useNavigation } = require('@react-navigation/native');
const api = require('../services/api');
const { StatusBadge } = require('../components/StatusBadge');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { Screen } = require('../components/Screen');

function OpportunityDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { needId } = route.params;
  
  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expressingInterest, setExpressingInterest] = useState(false);

  const fetchOpportunity = async () => {
    try {
      setError(null);
      const data = await api.get(`/service-needs/opportunities/${needId}`);
      setNeed(data.data);
    } catch (err) {
      setError(err.message || 'Error al cargar la oportunidad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunity();
  }, [needId]);

  const handleExpressInterest = async () => {
    Alert.alert(
      'Confirmar interés',
      '¿Querés expresar tu interés en esta oportunidad? El cliente recibirá una notificación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setExpressingInterest(true);
              await api.post(`/service-needs/${needId}/express-interest`, {
                message: 'Estoy interesado en esta oportunidad.',
              });
              Alert.alert('Éxito', 'Tu interés fue registrado. El cliente será notificado.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Error', err.message || 'No se pudo expresar el interés');
            } finally {
              setExpressingInterest(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !need) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Oportunidad no encontrada'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Screen>
        <ScrollView style={styles.scrollView}>
          {need.photoUrls && need.photoUrls.length > 0 ? (
            <Image source={{ uri: need.photoUrls[0] }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ServiceArtwork name="tool" size={50} color="#ccc" />
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{need.title}</Text>
              <StatusBadge status={need.status} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{need.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalles</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Categoría:</Text>
                <Text style={styles.detailValue}>{need.category?.name || 'No especificada'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ubicación:</Text>
                <Text style={styles.detailValue}>{need.city}, {need.province}</Text>
              </View>
              {need.budgetAmount && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Presupuesto:</Text>
                  <Text style={styles.detailValue}>${need.budgetAmount} {need.budgetCurrency}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.interestButton, expressingInterest && styles.disabledButton]}
              onPress={handleExpressInterest}
              disabled={expressingInterest}
            >
              <Text style={styles.interestButtonText}>
                {expressingInterest ? 'Enviando...' : 'Me interesa'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
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
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  interestButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  interestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

module.exports = { OpportunityDetailScreen };
