const React = require('react');
const { Ionicons } = require('@expo/vector-icons');
const { ActivityIndicator, Pressable, StyleSheet, Text } = require('react-native');
const { palette } = require('../theme');

function resolveTextColor(variant) {
  if (variant === 'secondary') {
    return palette.accentDark;
  }
  if (variant === 'ghost') {
    return palette.ink;
  }
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
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? palette.white : palette.accentDark} />
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
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 8,
  },
  secondary: {
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentSoft,
  },
  ghost: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  label: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryLabel: {
    color: palette.accentDark,
  },
  ghostLabel: {
    color: palette.ink,
  },
});

module.exports = {
  AppButton,
};
