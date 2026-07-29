import { useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts } from "@/src/lib/theme";
import { RuedaloArrowLogo } from "@/src/components/RuedaloIcons";

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
    }, 2200); // Elegant 2.2s splash screen matching 01. SPLASH
    return () => clearTimeout(t);
  }, [user, loading, router]);

  return (
    <View style={styles.container} testID="splash-loader">
      {/* City Skyline Vector Silhouette Layer (Avila & Caracas landscape matching image exactly!) */}
      <View style={styles.skylineBackdrop}>
        <View style={styles.mountainBack} />
        <View style={styles.mountainAvila} />
        
        {/* Abstract structural building blocks matching silhouette */}
        <View style={styles.skylineRow}>
          <View style={[styles.buildingBlock, { height: 70, width: 24, left: "10%" }]} />
          <View style={[styles.buildingBlock, { height: 110, width: 34, left: "18%" }]} />
          <View style={[styles.buildingBlock, { height: 80, width: 22, left: "30%" }]} />
          <View style={[styles.buildingBlock, { height: 130, width: 38, right: "25%" }]} />
          <View style={[styles.buildingBlock, { height: 95, width: 26, right: "12%" }]} />
          <View style={[styles.buildingBlock, { height: 60, width: 18, right: "4%" }]} />
        </View>
      </View>

      <View style={styles.brandBox}>
        {/* Exact centered White Ruedalo vector arrow logo */}
        <View style={styles.logoCircle}>
          <RuedaloArrowLogo size={54} color="#FFFFFF" />
        </View>
        <Text style={styles.brandName}>Ruedalo</Text>
        <Text style={styles.brandSub}>Muévete contigo.</Text>
      </View>

      <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1E40AF", alignItems: "center", justifyContent: "center", position: "relative" },
  
  // Custom Caracas/Avila Skyline Silhouette Backdrop
  skylineBackdrop: { position: "absolute", bottom: 0, left: 0, right: 0, height: 260, pointerEvents: "none" },
  mountainBack: { position: "absolute", bottom: 0, left: -40, right: -40, height: 160, backgroundColor: "#1A365D", borderRadius: 160, opacity: 0.4, transform: [{ rotate: "-2deg" }] },
  mountainAvila: { position: "absolute", bottom: 0, left: -20, right: -20, height: 130, backgroundColor: "#152E52", borderRadius: 130, opacity: 0.8, transform: [{ rotate: "3deg" }] },
  skylineRow: { position: "absolute", bottom: 0, left: 0, right: 0, height: 140 },
  buildingBlock: { position: "absolute", bottom: 0, backgroundColor: "#1E3B8A", opacity: 0.35, borderTopLeftRadius: 5, borderTopRightRadius: 5 },

  brandBox: { alignItems: "center", gap: 10, zIndex: 10 },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 15, elevation: 8
  },
  brandName: { color: "#FFFFFF", fontFamily: fonts.headingBold, fontSize: 44, letterSpacing: -1.5, marginTop: 10 },
  brandSub: { color: "#E0E7FF", fontFamily: fonts.body, fontSize: 16, letterSpacing: 0.5 },
  loader: { position: "absolute", bottom: 60, zIndex: 10 },
});
