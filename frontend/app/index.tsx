import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts } from "@/src/lib/theme";

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/(auth)/login");
    else if (user.role === "passenger") router.replace("/(passenger)");
    else if (user.role === "driver") router.replace("/(driver)");
    else if (user.role === "admin") router.replace("/(admin)");
  }, [user, loading, router]);

  return (
    <View style={styles.wrap} testID="splash-loader">
      <View style={styles.dot} />
      <Text style={styles.brand}>RideVE</Text>
      <ActivityIndicator color={colors.secondary} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  dot: { width: 16, height: 16, borderRadius: 999, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.8, shadowRadius: 12, elevation: 10 },
  brand: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 38, letterSpacing: 2 },
});
