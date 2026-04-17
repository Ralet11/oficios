const React = require('react');
const { ActivityIndicator, Pressable, StyleSheet, Text } = require('react-native');
const { palette } = require('../theme');

function AppButton({ children, onPress, variant = 'primary', disabled, loading }) {
  const inactive = disabled || loading;

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
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? palette.accent : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'secondary' && styles.secondaryLabel,
            variant === 'ghost' && styles.ghostLabel,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondary: {
    backgroundColor: palette.surfaceMuted,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.accent,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryLabel: {
    color: palette.ink,
  },
  ghostLabel: {
    color: palette.accent,
  },
});

module.exports = {
  AppButton,
};
