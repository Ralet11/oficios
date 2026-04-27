const React = require('react');
const { Ionicons } = require('@expo/vector-icons');
const { ActivityIndicator, Pressable, StyleSheet, Text } = require('react-native');
const { LinearGradient } = require('expo-linear-gradient');
const { palette } = require('../theme');

function resolveTextColor(variant) {
  if (variant === 'secondary') return palette.accentDark;
  if (variant === 'ghost') return palette.ink;
  return palette.white;
}

function AppButton({
  children,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  trailingIcon,
  style,
}) {
  const inactive = disabled || loading;
  const textColor = resolveTextColor(variant);
  const isPrimary = variant === 'primary';

  const inner = loading ? (
    <ActivityIndicator color={isPrimary ? palette.white : palette.accentDark} />
  ) : (
    <>
      {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
      <Text
        style={[
          styles.label,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'ghost' && styles.ghostLabel,
        ]}
      >
        {children}
      </Text>
      {trailingIcon ? <Ionicons name={trailingIcon} size={18} color={textColor} /> : null}
    </>
  );

  if (isPrimary) {
    return (
      <Pressable
        disabled={inactive}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          styles.primaryShell,
          inactive && styles.disabled,
          pressed && !inactive && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={[palette.accentDark, palette.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {inner}
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
  },
  primaryShell: {
    shadowColor: palette.accentDeep,
    shadowOpacity: 0.38,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  secondary: {
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(57, 169, 255, 0.22)',
  },
  ghost: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.9,
  },
  label: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryLabel: {
    color: palette.accentDark,
  },
  ghostLabel: {
    color: palette.ink,
  },
});

module.exports = { AppButton };
