const React = require('react');
const { Alert, StyleSheet, Text, View } = require('react-native');
const { useRoute, useFocusEffect } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { StatusBadge } = require('../components/StatusBadge');
const { getCategoryIcon } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, spacing } = require('../theme');

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Date(value).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBudget(detail) {
  if (!detail.budgetAmount) {
    return 'A coordinar';
  }

  return `${detail.budgetCurrency || 'ARS'} ${Number(detail.budgetAmount).toLocaleString('es-AR')}`;
}

function buildTimeline(detail) {
  const accepted = ['ACCEPTED', 'COMPLETED'].includes(detail.status);
  const completed = detail.status === 'COMPLETED';

  return [
    {
      title: 'Service Ordered',
      description: detail.category?.name || 'Solicitud creada',
      active: true,
    },
    {
      title: 'Professional Response',
      description: accepted ? 'Aceptada por el profesional' : 'Pendiente de respuesta',
      active: accepted,
    },
    {
      title: 'Cleaning Process',
      description: completed ? 'Trabajo marcado como completado' : 'En seguimiento',
      active: completed,
    },
  ];
}

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
      Alert.alert('No se pudo crear la resena', error.message);
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
        <EmptyState title="Solicitud no disponible" message="No se pudo encontrar la conversacion." />
      </Screen>
    );
  }

  const isCustomer = detail.customer?.id === user.id;
  const isProfessional = detail.professional?.user?.id === user.id;
  const canReview = isCustomer && !detail.review && ['ACCEPTED', 'COMPLETED'].includes(detail.status);
  const location = [detail.city, detail.province].filter(Boolean).join(', ') || 'Argentina';
  const timeline = buildTimeline(detail);

  return (
    <Screen contentStyle={styles.content}>
      <ServiceArtwork
        size="banner"
        icon={getCategoryIcon(detail.category, 0)}
        badge={detail.category?.name || 'Booking'}
        title={detail.title}
        subtitle={location}
      />

      <View style={styles.headerMeta}>
        <StatusBadge status={detail.status} />
        <Text style={styles.headerCopy}>{detail.customerMessage}</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTabs}>
          <Text style={styles.summaryTabActive}>Services</Text>
          <Text style={styles.summaryTab}>Worker</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Estimate service</Text>
            <Text style={styles.summaryValue}>{formatDate(detail.updatedAt || detail.createdAt)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Type service</Text>
            <Text style={styles.summaryValue}>{detail.category?.name || 'Standard'}</Text>
          </View>
        </View>
      </View>

      <SectionCard title="Order Progress">
        {timeline.map((step) => (
          <View key={step.title} style={styles.timelineRow}>
            <View style={[styles.timelineDot, step.active && styles.timelineDotActive]}>
              <Ionicons
                name={step.active ? 'checkmark' : 'ellipse-outline'}
                size={14}
                color={step.active ? palette.white : palette.accentDark}
              />
            </View>
            <View style={styles.timelineCopy}>
              <Text style={styles.timelineTitle}>{step.title}</Text>
              <Text style={styles.timelineText}>{step.description}</Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Contact and Details">
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailValue}>{detail.addressLine || 'No informada'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Professional</Text>
          <Text style={styles.detailValue}>{detail.professional?.businessName || 'A definir'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Budget</Text>
          <Text style={styles.detailValue}>{formatBudget(detail)}</Text>
        </View>

        {detail.professional?.contact ? (
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>Unlocked Contact</Text>
            <Text style={styles.contactText}>Telefono: {detail.professional.contact.phone || 'No informado'}</Text>
            <Text style={styles.contactText}>WhatsApp: {detail.professional.contact.whatsapp || 'No informado'}</Text>
            <Text style={styles.contactText}>Email: {detail.professional.contact.email || 'No informado'}</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="Messages">
        {detail.messages?.length ? (
          detail.messages.map((item) => {
            const own = item.sender?.id === user.id;

            return (
              <View key={item.id} style={[styles.messageBubble, own ? styles.messageOwn : styles.messageOther]}>
                <Text style={[styles.messageAuthor, own && styles.messageAuthorOwn]}>
                  {item.isSystemMessage ? 'Sistema' : `${item.sender?.firstName || ''} ${item.sender?.lastName || ''}`.trim()}
                </Text>
                <Text style={[styles.messageBody, own && styles.messageBodyOwn]}>{item.body}</Text>
              </View>
            );
          })
        ) : (
          <EmptyState title="No messages yet" message="La conversacion todavia no empezo." />
        )}

        <AppInput
          label="New Message"
          value={message}
          onChangeText={setMessage}
          multiline
          leftIcon="chatbubble-ellipses-outline"
        />
        <AppButton onPress={sendMessage} loading={submitting} disabled={!message.trim()}>
          Send Message
        </AppButton>
      </SectionCard>

      <SectionCard title="Actions">
        {isProfessional && detail.status === 'PENDING' ? (
          <View style={styles.actionList}>
            <AppButton onPress={() => changeStatus('ACCEPTED')} loading={submitting}>
              Accept Request
            </AppButton>
            <AppButton onPress={() => changeStatus('REJECTED')} variant="secondary" loading={submitting}>
              Reject
            </AppButton>
          </View>
        ) : null}
        {isCustomer && detail.status === 'PENDING' ? (
          <AppButton onPress={() => changeStatus('CANCELLED')} variant="secondary" loading={submitting}>
            Cancel Request
          </AppButton>
        ) : null}
        {detail.status === 'ACCEPTED' ? (
          <AppButton onPress={() => changeStatus('COMPLETED')} variant="ghost" loading={submitting}>
            Mark as Completed
          </AppButton>
        ) : null}
        {!isCustomer && !isProfessional ? <EmptyState title="No actions" message="No participas de esta solicitud." /> : null}
      </SectionCard>

      {canReview ? (
        <SectionCard title="Leave a Review">
          <AppInput
            label="Rating (1 to 5)"
            value={review.rating}
            onChangeText={(value) => setReview((current) => ({ ...current, rating: value }))}
            keyboardType="numeric"
            leftIcon="star-outline"
          />
          <AppInput
            label="Comment"
            value={review.comment}
            onChangeText={(value) => setReview((current) => ({ ...current, comment: value }))}
            multiline
            leftIcon="create-outline"
          />
          <AppButton onPress={submitReview} loading={submitting} disabled={!review.comment.trim()}>
            Publish Review
          </AppButton>
        </SectionCard>
      ) : null}

      {detail.review ? (
        <SectionCard title="Existing Review">
          <View style={styles.reviewPill}>
            <Ionicons name="star" size={14} color={palette.warning} />
            <Text style={styles.reviewPillText}>{detail.review.rating}</Text>
          </View>
          <Text style={styles.reviewBody}>{detail.review.comment}</Text>
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 140,
  },
  headerMeta: {
    gap: 10,
  },
  headerCopy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    overflow: 'hidden',
  },
  summaryTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  summaryTabActive: {
    color: palette.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryTab: {
    color: palette.mutedSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    padding: 18,
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  timelineDotActive: {
    backgroundColor: palette.accent,
  },
  timelineCopy: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  timelineTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  timelineText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  detailRow: {
    gap: 2,
  },
  detailLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  contactBox: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: palette.accentSoft,
    gap: 4,
  },
  contactTitle: {
    color: palette.accentDark,
    fontSize: 14,
    fontWeight: '800',
  },
  contactText: {
    color: palette.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  messageBubble: {
    maxWidth: '92%',
    padding: 14,
    borderRadius: 18,
    gap: 6,
  },
  messageOwn: {
    alignSelf: 'flex-end',
    backgroundColor: palette.accent,
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surfaceElevated,
  },
  messageAuthor: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  messageAuthorOwn: {
    color: palette.whiteSoft,
  },
  messageBody: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 19,
  },
  messageBodyOwn: {
    color: palette.white,
  },
  actionList: {
    gap: 12,
  },
  reviewPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  reviewPillText: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewBody: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});

module.exports = {
  RequestDetailScreen,
};
