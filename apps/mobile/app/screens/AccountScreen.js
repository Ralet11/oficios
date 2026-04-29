const React = require('react');
const { Animated, Pressable, StyleSheet, Text, View } = require('react-native');
const { useNavigation } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { LoadingView } = require('../components/LoadingView');
const { useAuth } = require('../contexts/AuthContext');
const { APP_MODES } = require('../services/sessionMode');
const { palette, spacing } = require('../theme');
const {
  ProfileHeader,
  SectionHeader,
  StatRow,
  SettingsRow,
  ReputationSection,
} = require('../components/account');

function formatPhone(phone) {
  if (!phone) {
    return 'No informado';
  }

  return phone;
}

function formatProfessionalStatus(status) {
  const labels = {
    DRAFT: 'Borrador',
    PENDING_APPROVAL: 'Pendiente de aprobacion',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    PAUSED: 'Pausado',
  };

  return labels[status] || 'Sin estado';
}

function AccountScreen() {
  const navigation = useNavigation();
  const {
    user,
    signOut,
    customerProfile,
    professionalProfile,
    activeMode,
    switchToCustomerMode,
    switchToProfessionalMode,
  } = useAuth();
  const [modeRailWidth, setModeRailWidth] = React.useState(0);
  const isProfessional = (user?.roles || []).includes('PROFESSIONAL');
  const isProfessionalMode = activeMode === APP_MODES.PROFESSIONAL;
  const modeProgress = React.useRef(new Animated.Value(isProfessionalMode ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(modeProgress, {
      toValue: isProfessionalMode ? 1 : 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 16,
    }).start();
  }, [isProfessionalMode, modeProgress]);

  if (!user) {
    return <LoadingView label="Cargando cuenta..." />;
  }

  const phone = formatPhone(user.phone);
  const city = customerProfile?.city || 'No configurada';
  const reviewCount = customerProfile?.reviewCount || 0;
  const professionalStatus = professionalProfile?.status || 'DRAFT';
  const activityLabel = isProfessionalMode
    ? professionalStatus === 'APPROVED'
      ? 'Conversaciones'
      : 'Mi hub profesional'
    : 'Mis problemas';
  const activityValue = isProfessionalMode
    ? professionalStatus === 'APPROVED'
      ? 'Ver bandeja profesional'
      : 'Completar o revisar perfil'
    : 'Ver y editar mis problemas';
  const railInset = 4;
  const segmentWidth = modeRailWidth ? (modeRailWidth - railInset * 2) / 2 : 0;
  const thumbTranslateX = modeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth],
  });

  async function handleModeAction(nextMode) {
    if (nextMode === APP_MODES.CUSTOMER) {
      if (!isProfessionalMode) {
        return;
      }

      await switchToCustomerMode();
      return;
    }

    if (!isProfessional) {
      navigation.navigate('ProfessionalHubEntry');
      return;
    }

    if (isProfessionalMode) {
      return;
    }

    await switchToProfessionalMode();
  }

  function handleActivityPress() {
    navigation.navigate(
      isProfessionalMode && professionalStatus !== 'APPROVED' ? 'ProfessionalHub' : 'Requests',
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <ProfileHeader user={user} customerProfile={customerProfile} />

      <View style={styles.section}>
        <SectionHeader title="Modo actual" />
        {isProfessional ? (
          <View style={styles.modeCard}>
            <View
              onLayout={(event) => setModeRailWidth(event.nativeEvent.layout.width)}
              style={styles.modeRail}
            >
              {segmentWidth ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.modeThumb,
                    {
                      width: segmentWidth,
                      transform: [{ translateX: thumbTranslateX }],
                    },
                  ]}
                />
              ) : null}

              <Pressable
                onPress={() => handleModeAction(APP_MODES.CUSTOMER)}
                style={styles.modeOption}
              >
                <Ionicons
                  color={isProfessionalMode ? palette.muted : palette.accentDark}
                  name="person-outline"
                  size={16}
                />
                <Text style={[styles.modeOptionText, !isProfessionalMode && styles.modeOptionTextActive]}>
                  Cliente
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleModeAction(APP_MODES.PROFESSIONAL)}
                style={styles.modeOption}
              >
                <Ionicons
                  color={isProfessionalMode ? palette.accentDark : palette.muted}
                  name="briefcase-outline"
                  size={16}
                />
                <Text style={[styles.modeOptionText, isProfessionalMode && styles.modeOptionTextActive]}>
                  Profesional
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => navigation.navigate('ProfessionalHubEntry')}
            style={({ pressed }) => [styles.professionalCtaCard, pressed && styles.professionalCtaCardPressed]}
          >
            <View style={styles.professionalCtaIconWrap}>
              <Ionicons color={palette.accentDark} name="briefcase-outline" size={18} />
            </View>
            <View style={styles.professionalCtaCopy}>
              <Text style={styles.professionalCtaTitle}>Conviertete en profesional</Text>
              <Text style={styles.professionalCtaText}>Activa tu perfil y empieza el onboarding para publicar tus servicios.</Text>
            </View>
            <Ionicons color={palette.muted} name="chevron-forward" size={18} />
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Tu reputacion" />
        <ReputationSection customerProfile={customerProfile} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Tus datos"
          action="Editar"
          onActionPress={() => navigation.navigate('EditCustomerProfile')}
        />
        <View style={styles.dataRows}>
          <StatRow icon="phone" label="Telefono" value={phone} />
          <StatRow icon="email" label="Email" value={user.email || 'No informado'} />
          <StatRow icon="map" label="Ciudad" value={city} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Actividad" />
        <View style={styles.dataRows}>
          <StatRow
            icon="clipboard-text"
            label={activityLabel}
            onPress={handleActivityPress}
            showChevron
            value={activityValue}
          />
          <StatRow
            icon="message-draw"
            label={isProfessionalMode ? 'Estado del perfil profesional' : `Resenas escritas (${reviewCount})`}
            onPress={isProfessionalMode ? () => navigation.navigate('ProfessionalHub') : undefined}
            showChevron={isProfessionalMode}
            value={isProfessionalMode ? formatProfessionalStatus(professionalStatus) : 'Tu historial como cliente'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Acciones" />
        <View style={styles.dataRows}>
          <SettingsRow
            icon="help-circle"
            label="Ayuda y soporte"
            onPress={() => navigation.navigate('Help')}
          />
          <SettingsRow
            icon="shield-account"
            label="Privacidad"
            onPress={() => navigation.navigate('Privacy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            danger
            icon="logout"
            label="Cerrar sesion"
            onPress={signOut}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: 140,
  },
  section: {
    gap: spacing.xs,
  },
  modeCard: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  modeRail: {
    position: 'relative',
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    backgroundColor: palette.surfaceElevated,
    overflow: 'hidden',
  },
  modeThumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 12,
    backgroundColor: palette.surface,
    shadowColor: palette.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
  modeOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  modeOptionText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  modeOptionTextActive: {
    color: palette.accentDark,
  },
  professionalCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  professionalCtaCardPressed: {
    opacity: 0.88,
  },
  professionalCtaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  professionalCtaCopy: {
    flex: 1,
    gap: 3,
  },
  professionalCtaTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  professionalCtaText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  dataRows: {
    gap: 0,
  },
  divider: {
    height: spacing.xs,
  },
});

module.exports = {
  AccountScreen,
};
