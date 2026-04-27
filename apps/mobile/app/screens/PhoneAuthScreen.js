const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { useAuth } = require('../contexts/AuthContext');
const { palette, shadows, spacing } = require('../theme');

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');

  return { firstName, lastName };
}

function buildCopy(step, mode) {
  if (step === 'phone') {
    return mode === 'login'
      ? 'Usá tu número para recibir un código y entrar sin contraseña.'
      : 'Empezá con tu teléfono. Si es tu primera vez, completás nombre y email al final.';
  }

  if (step === 'code') {
    return 'Ingresá el código de 6 dígitos que enviamos a tu teléfono.';
  }

  return mode === 'login'
    ? 'No encontramos una cuenta con ese número. Completá estos datos y la creamos.'
    : 'Ya validamos tu teléfono. Falta tu nombre y el email para dejar lista la cuenta.';
}

function StepDot({ active, done }) {
  return (
    <View
      style={[
        styles.stepDot,
        active && styles.stepDotActive,
        done && styles.stepDotDone,
      ]}
    />
  );
}

function PhoneAuthScreen({ navigation, route }) {
  const mode = route.params?.mode === 'login' ? 'login' : 'register';
  const { requestPhoneCode, continueWithPhone } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState('phone');
  const [phone, setPhone] = React.useState('');
  const [normalizedPhone, setNormalizedPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [devCode, setDevCode] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');

  const phoneForRequest = normalizedPhone || phone;
  const stepIndex = step === 'phone' ? 0 : step === 'code' ? 1 : 2;

  async function handleSendCode() {
    try {
      setLoading(true);
      const response = await requestPhoneCode(phone);
      setNormalizedPhone(response.phone || phone);
      setDevCode(response.devCode || '');
      setCode('');
      setStep('code');
    } catch (error) {
      Alert.alert('No se pudo enviar el código', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    try {
      setLoading(true);
      const response = await continueWithPhone({
        phone: phoneForRequest,
        code,
      });

      if (response.status === 'PROFILE_REQUIRED') {
        setNormalizedPhone(response.phone || phoneForRequest);
        setStep('profile');
      }
    } catch (error) {
      Alert.alert('No se pudo validar el código', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAccount() {
    try {
      setLoading(true);
      const { firstName, lastName } = splitName(fullName);

      if (!firstName || !lastName) {
        throw new Error('Ingresá nombre y apellido.');
      }

      await continueWithPhone({
        phone: phoneForRequest,
        code,
        firstName,
        lastName,
        email,
      });
    } catch (error) {
      Alert.alert('No se pudo completar la cuenta', error.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrimary() {
    if (step === 'phone') {
      return handleSendCode();
    }

    if (step === 'code') {
      return handleVerifyCode();
    }

    return handleCreateAccount();
  }

  function handleBackStep() {
    if (step === 'profile') {
      setStep('code');
      return;
    }

    if (step === 'code') {
      setStep('phone');
      return;
    }

    navigation.goBack();
  }

  return (
    <Screen contentStyle={styles.content} gradient>
      <View pointerEvents="none" style={styles.backgroundOrbTop} />
      <View pointerEvents="none" style={styles.backgroundOrbBottom} />

      <View style={styles.topRow}>
        <Pressable onPress={handleBackStep} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={18} color={palette.ink} />
        </Pressable>
      </View>

      <View style={[styles.heroCard, shadows.card]}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{mode === 'login' ? 'Acceso rápido' : 'Alta moderna'}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>
            {step === 'phone'
              ? 'Entrá con tu número'
              : step === 'code'
                ? 'Validá el código'
                : 'Completá tu cuenta'}
          </Text>
          <Text style={styles.copy}>{buildCopy(step, mode)}</Text>
        </View>
        <View style={styles.stepsRow}>
          <StepDot active={stepIndex === 0} done={stepIndex > 0} />
          <StepDot active={stepIndex === 1} done={stepIndex > 1} />
          <StepDot active={stepIndex === 2} done={false} />
        </View>
      </View>

      <View style={[styles.formCard, shadows.card]}>
        {step === 'phone' ? (
          <AppInput
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            prefix="+54"
            leftIcon="call-outline"
            placeholder="11 5555 5555"
            helperText="Lo usamos para enviarte un código por SMS."
          />
        ) : null}

        {step === 'code' ? (
          <>
            <AppInput
              label="Código"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              leftIcon="key-outline"
              placeholder="123456"
              maxLength={6}
              helperText={
                devCode
                  ? `Código demo: ${devCode}`
                  : `Enviado a ${normalizedPhone || phoneForRequest}`
              }
            />
            <Pressable onPress={handleSendCode} style={styles.inlineLink}>
              <Text style={styles.inlineLinkText}>Reenviar código</Text>
            </Pressable>
          </>
        ) : null}

        {step === 'profile' ? (
          <>
            <AppInput
              label="Nombre y apellido"
              value={fullName}
              onChangeText={setFullName}
              leftIcon="person-outline"
              placeholder="Ana Pérez"
            />
            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="mail-outline"
              placeholder="ana@gmail.com"
              helperText="Lo usamos para recibos, soporte y recuperar tu cuenta."
            />
          </>
        ) : null}

        <AppButton
          onPress={handlePrimary}
          loading={loading}
          disabled={
            (step === 'phone' && !phone.trim()) ||
            (step === 'code' && code.trim().length !== 6) ||
            (step === 'profile' && (!fullName.trim() || !email.trim()))
          }
        >
          {step === 'phone'
            ? 'Enviar código'
            : step === 'code'
              ? 'Continuar'
              : 'Crear cuenta'}
        </AppButton>

        {step !== 'phone' ? (
          <AppButton variant="ghost" onPress={handleBackStep} disabled={loading}>
            Cambiar paso
          </AppButton>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 56,
  },
  backgroundOrbTop: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(57, 169, 255, 0.1)',
    top: -60,
    right: -80,
  },
  backgroundOrbBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(87, 190, 180, 0.12)',
    bottom: 80,
    left: -90,
  },
  topRow: {
    flexDirection: 'row',
    zIndex: 2,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  heroCard: {
    gap: 16,
    padding: 22,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E9F6F2',
  },
  heroBadgeText: {
    color: '#167664',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroCopy: {
    gap: 8,
  },
  title: {
    color: palette.ink,
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '800',
  },
  copy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: palette.border,
  },
  stepDotActive: {
    backgroundColor: palette.accent,
  },
  stepDotDone: {
    backgroundColor: palette.accentDark,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    padding: 22,
    gap: 16,
  },
  inlineLink: {
    alignItems: 'center',
  },
  inlineLinkText: {
    color: palette.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
});

module.exports = {
  PhoneAuthScreen,
};
