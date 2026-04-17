const React = require('react');
const { StyleSheet, Text, TextInput, View } = require('react-native');
const { palette, type } = require('../theme');

function AppInput({ label, multiline, helperText, ...props }) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#7B8794"
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    ...type.label,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    minHeight: 52,
    color: palette.ink,
    fontSize: 15,
  },
  multiline: {
    minHeight: 120,
    paddingTop: 16,
    paddingBottom: 16,
  },
  helper: {
    fontSize: 12,
    color: palette.muted,
  },
});

module.exports = {
  AppInput,
};
