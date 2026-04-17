const React = require('react');
const { Ionicons } = require('@expo/vector-icons');
const { StyleSheet, Text, TextInput, View } = require('react-native');
const { palette, type } = require('../theme');

function AppInput({
  label,
  multiline,
  helperText,
  leftIcon,
  rightIcon,
  prefix,
  inputStyle,
  fieldStyle,
  ...props
}) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, multiline && styles.fieldMultiline, fieldStyle]}>
        {leftIcon ? <Ionicons name={leftIcon} size={18} color={palette.muted} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={palette.mutedSoft}
          style={[styles.input, multiline && styles.multiline, inputStyle]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        {rightIcon ? <Ionicons name={rightIcon} size={18} color={palette.mutedSoft} /> : null}
      </View>
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
    color: palette.ink,
  },
  field: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  prefix: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    color: palette.ink,
    fontSize: 15,
    paddingVertical: 0,
  },
  multiline: {
    minHeight: 120,
    paddingTop: 0,
    paddingBottom: 14,
  },
  helper: {
    fontSize: 12,
    color: palette.muted,
  },
});

module.exports = {
  AppInput,
};
