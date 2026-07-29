import { useEffect } from "react";
import { View, StyleSheet, Text, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii } from "@/src/lib/theme";

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (!user) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(passenger)");
      }
    }, 2000); // Elegant 2-second splash screen matching 01. SPLASH
    return () => clearTimeout(t);
  }, [user, loading, router]);

  return (
    <View style={styles.container} testID="splash-loader">
      <View style={styles.brandBox}>
        {/* Customized Native Styled Vector Logo of Ruedalo (Pillar 5) */}
        <View style={styles.logoCircle}>
          <View style={styles.logoChevron} />
        </View>
        <Text style={styles.brandName}>Ruedalo</Text>
        <Text style={styles.brandSub}>Muévete contigo</Text>
      </View>
      <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  brandBox: { alignItems: "center", gap: 8 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8
  },
  logoChevron: {
    width: 32, height: 32, borderWidth: 6, borderColor: "#FFFFFF",
    borderLeftWidth: 0, borderBottomWidth: 0,
    transform: [{ rotate: "45deg" }], marginLeft: -8, marginTop: 4
  },
  brandName: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 36, letterSpacing: -1 },
  brandSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, letterSpacing: 0.5 },
  loader: { marginTop: 48 },
});
