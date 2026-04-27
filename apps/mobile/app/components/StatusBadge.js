const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { statusStyles } = require('../theme');

function normalize(status) {
  if (status === 'REJECTED') {
    return 'REJECTED';
  }
  return status;
}

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  OPEN: 'Abierto',
  SELECTION_PENDING_CONFIRMATION: 'Esperando confirmacion',
  MATCHED: 'Elegido',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendiente',
  AWAITING_PRO_CONFIRMATION: 'Esperando al profesional',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  COMPLETED: 'Completado',
  EXPIRED: 'Vencido',
  APPROVED: 'Aprobado',
  PENDING_APPROVAL: 'Pendiente',
  PAUSED: 'Pausado',
  VISIBLE: 'Visible',
  HIDDEN: 'Oculto',
};

function StatusBadge({ status }) {
  const key = normalize(status);
  const stylesForStatus = statusStyles[key] || statusStyles.DRAFT;
  const label = STATUS_LABELS[key] || String(status).replace(/_/g, ' ');

  return (
    <View style={[styles.badge, { backgroundColor: stylesForStatus.backgroundColor }]}>
      <Text style={[styles.text, { color: stylesForStatus.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

module.exports = {
  StatusBadge,
};
