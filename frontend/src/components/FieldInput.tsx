import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors, fonts, radii } from "@/src/lib/theme";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export function FieldInput({ label, error, rightIcon, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...props}
        />
        {rightIcon}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  field: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  fieldError: { borderColor: colors.danger },
  input: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingVertical: 14,
    flex: 1,
  },
  error: { color: colors.danger, fontFamily: fonts.body, fontSize: 12 },
});
