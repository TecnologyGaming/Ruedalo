import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View } from "react-native";
import { colors, fonts, radii, shadows } from "@/src/lib/theme";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function NeonButton({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  testID,
  style,
  icon,
  fullWidth = true,
}: Props) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const isDanger = variant === "danger";

  const bg = isPrimary ? colors.primary : isDanger ? colors.danger : isSecondary ? "transparent" : "transparent";
  const borderColor = isSecondary ? colors.secondary : "transparent";
  const textColor = isSecondary ? colors.secondary : isGhost ? colors.textSecondary : "#fff";
  const shadow = isPrimary ? shadows.neonPrimary : isSecondary ? shadows.neonSecondary : {};

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor, borderWidth: isSecondary ? 2 : 0, opacity: disabled ? 0.5 : 1, alignSelf: fullWidth ? "stretch" : "auto" },
        !isGhost && shadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radii.full,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: { fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 0.3 },
});
