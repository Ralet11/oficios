const React = require('react');
const { Alert, StyleSheet, Text, View } = require('react-native');
const { useRoute, useFocusEffect } = require('@react-navigation/native');
const { hasRole } = require('@oficios/domain');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { StatusBadge } = require('../components/StatusBadge');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, type } = require('../theme');

function RequestDetailScreen() {
  const route = useRoute();
  const { token, user } = useAuth();
  const requestId = route.params.requestId;
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [review, setReview] = React.useState({ rating: '5', comment: '' });

  const load = React.useCallback(async () => {
    try {
      const response = await api.serviceRequest(requestId, token);
      setDetail(response.data);
    } catch (error) {
      Alert.alert('No se pudo cargar la solicitud', error.message);
    } finally {
      setLoading(false);
    }
  }, [requestId, token]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  async function changeStatus(status) {
    try {
      setSubmitting(true);
      await api.updateServiceRequestStatus(requestId, { status }, token);
      await load();
    } catch (error) {
      Alert.alert('No se pudo cambiar el estado', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendMessage() {
    try {
      setSubmitting(true);
      await api.createServiceRequestMessage(requestId, { body: message }, token);
      setMessage('');
      await load();
    } catch (error) {
      Alert.alert('No se pudo enviar el mensaje', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReview() {
    try {
      setSubmitting(true);
      await api.createReview(
        {
          serviceRequestId: detail.id,
          rating: Number(review.rating),
          comment: review.comment,
        },
        token,
      );
      setReview({ rating: '5', comment: '' });
      await load();
    } catch (error) {
      Alert.alert('No se pudo crear la reseña', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingView label="Cargando solicitud..." />;
  }

  if (!detail) {
    return (
      <Screen>
        <EmptyState title="Solicitud no disponible" message="No se pudo encontrar la conversación." />
      </Screen>
    );
  }

  const isCustomer = detail.customer?.id === user.id;
  const isProfessional = detail.professional?.user?.id === user.id;
  const canReview = isCustomer && !detail.review && ['ACCEPTED', 'COMPLETED'].includes(detail.status);

  return (
    <Screen>
      <SectionCard
        title={detail.title}
        subtitle={`${detail.city}, ${detail.province}`}
        footer={
          <View style={styles.footerLine}>
            <Text style={styles.footerText}>{detail.category?.name}</Text>
            <Text style={styles.footerText}>Presupuesto: {detail.budgetAmount || 'A coordinar'} {detail.budgetCurrency}</Text>
          </View>
        }
      >
        <StatusBadge status={detail.status} />
        <Text style={styles.body}>{detail.customerMessage}</Text>
        <Text style={styles.meta}>Dirección: {detail.addressLine}</Text>
        {detail.professional?.contact ? (
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>Contacto desbloqueado</Text>
            <Text style={styles.contactText}>Teléfono: {detail.professional.contact.phone || 'No informado'}</Text>
            <Text style={styles.contactText}>WhatsApp: {detail.professional.contact.whatsapp || 'No informado'}</Text>
            <Text style={styles.contactText}>Email: {detail.professional.contact.email || 'No informado'}</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="Acciones">
        {isProfessional && detail.status === 'PENDING' ? (
          <View style={styles.actions}>
            <AppButton onPress={() => changeStatus('ACCEPTED')} loading={submitting}>
              Aceptar
            </AppButton>
            <AppButton onPress={() => changeStatus('REJECTED')} variant="secondary" loading={submitting}>
              Rechazar
            </AppButton>
          </View>
        ) : null}
        {isCustomer && detail.status === 'PENDING' ? (
          <AppButton onPress={() => changeStatus('CANCELLED')} variant="secondary" loading={submitting}>
            Cancelar solicitud
          </AppButton>
        ) : null}
        {['ACCEPTED'].includes(detail.status) ? (
          <AppButton onPress={() => changeStatus('COMPLETED')} variant="ghost" loading={submitting}>
            Marcar como completada
          </AppButton>
        ) : null}
        {!isCustomer && !isProfessional ? <EmptyState title="Sin acciones" message="No participás de esta solicitud." /> : null}
      </SectionCard>

      <SectionCard title="Mensajes">
        {detail.messages?.length ? (
          detail.messages.map((item) => (
            <View key={item.id} style={[styles.messageBubble, item.sender?.id === user.id ? styles.messageOwn : styles.messageOther]}>
              <Text style={styles.messageAuthor}>{item.isSystemMessage ? 'Sistema' : `${item.sender?.firstName || ''} ${item.sender?.lastName || ''}`}</Text>
              <Text style={styles.messageBody}>{item.body}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="Sin mensajes" message="La conversación todavía no empezó." />
        )}
        <AppInput label="Nuevo mensaje" value={message} onChangeText={setMessage} multiline />
        <AppButton onPress={sendMessage} loading={submitting} disabled={!message.trim()}>
          Enviar mensaje
        </AppButton>
      </SectionCard>

      {canReview ? (
        <SectionCard title="Dejar reseña">
          <AppInput label="Puntaje (1 a 5)" value={review.rating} onChangeText={(value) => setReview((current) => ({ ...current, rating: value }))} keyboardType="numeric" />
          <AppInput
            label="Comentario"
            value={review.comment}
            onChangeText={(value) => setReview((current) => ({ ...current, comment: value }))}
            multiline
          />
          <AppButton onPress={submitReview} loading={submitting} disabled={!review.comment.trim()}>
            Publicar reseña
          </AppButton>
        </SectionCard>
      ) : null}

      {detail.review ? (
        <SectionCard title="Reseña existente">
          <StatusBadge status={detail.review.status} />
          <Text style={styles.reviewText}>★ {detail.review.rating}</Text>
          <Text style={styles.body}>{detail.review.comment}</Text>
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footerLine: {
    gap: 8,
  },
  footerText: {
    color: palette.muted,
  },
  body: {
    ...type.body,
  },
  meta: {
    color: palette.ink,
    fontWeight: '600',
  },
  contactBox: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 18,
    gap: 6,
  },
  contactTitle: {
    color: palette.accentDark,
    fontWeight: '700',
  },
  contactText: {
    color: palette.ink,
  },
  actions: {
    gap: 12,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
    gap: 6,
  },
  messageOwn: {
    backgroundColor: '#FDEBD9',
  },
  messageOther: {
    backgroundColor: '#EEF2F6',
  },
  messageAuthor: {
    fontWeight: '700',
    color: palette.ink,
  },
  messageBody: {
    ...type.body,
    color: palette.ink,
  },
  reviewText: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
  },
});

module.exports = {
  RequestDetailScreen,
};
