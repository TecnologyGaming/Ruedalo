import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { colors, fonts, radii, shadows } from "@/src/lib/theme";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react-native";

type ToastType = "success" | "error" | "info";

let _push: ((m: string, t?: ToastType) => void) | null = null;
export function toast(message: string, type: ToastType = "info") {
  if (_push) _push(message, type);
}

export function ToastHost() {
  const [items, setItems] = useState<{ id: number; message: string; type: ToastType; anim: Animated.Value }[]>([]);

  useEffect(() => {
    _push = (message, type = "info") => {
      const id = Date.now() + Math.random();
      const anim = new Animated.Value(0);
      setItems((prev) => [...prev, { id, message, type, anim }]);
      Animated.timing(anim, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
          setItems((prev) => prev.filter((i) => i.id !== id));
        });
      }, 3200);
    };
    return () => {
      _push = null;
    };
  }, []);

  return (
    <View pointerEvents="none" style={styles.host} testID="toast-host">
      {items.map((i) => {
        const Icon = i.type === "success" ? CheckCircle2 : i.type === "error" ? XCircle : AlertCircle;
        const color = i.type === "success" ? colors.secondary : i.type === "error" ? colors.danger : colors.primary;
        return (
          <Animated.View
            key={i.id}
            style={[
              styles.toast,
              { borderColor: color, transform: [{ translateY: i.anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }], opacity: i.anim },
              i.type === "success" ? shadows.neonSecondary : i.type === "error" ? {} : shadows.neonPrimary,
            ]}
          >
            <Icon size={20} color={color} />
            <Text style={styles.text}>{i.message}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    flex: 1,
  },
});
