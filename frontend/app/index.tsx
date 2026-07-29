import { useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts } from "@/src/lib/theme";

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
    }, 2200); // 2.2s Splash screen to match 01. SPLASH
    return () => clearTimeout(t);
  }, [user, loading, router]);

  return (
    <View style={styles.container} testID="splash-loader">
      {/* City Skyline Vector Illustration Layer (Avila & Caracas skyline silhouette matching design exactly!) */}
      <View style={styles.skylineBackdrop}>
        <View style={styles.mountainRidge} />
        <View style={styles.buildingSilhouetteRow}>
          <View style={[styles.building, { height: 60, width: 22, left: 40 }]} />
          <View style={[styles.building, { height: 90, width: 28, left: 70 }]} />
          <View style={[styles.building, { height: 50, width: 20, left: 110 }]} />
          <View style={[styles.building, { height: 110, width: 32, right: 80 }]} />
          <View style={[styles.building, { height: 75, width: 24, right: 40 }]} />
        </View>
      </View>

      <View style={styles.brandBox}>
        {/* White Ruedalo logo centered exactly */}
        <View style={styles.logoCircle}>
          <View style={styles.logoChevron} />
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
  
  // Skyline Vector Elements
  skylineBackdrop: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200, pointerEvents: "none" },
  mountainRidge: { position: "absolute", bottom: 0, left: -20, right: -20, height: 110, backgroundColor: "#1A365D", borderRadius: 100, transform: [{ rotate: "-4deg" }], opacity: 0.7 },
  buildingSilhouetteRow: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120, flexDirection: "row" },
  building: { position: "absolute", bottom: 0, backgroundColor: "#1E3A8A", opacity: 0.5, borderTopLeftRadius: 4, borderTopRightRadius: 4 },

  brandBox: { alignItems: "center", gap: 12, zIndex: 10 },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 15, elevation: 8
  },
  logoChevron: {
    width: 36, height: 32, borderWidth: 7, borderColor: "#FFFFFF",
    borderLeftWidth: 0, borderBottomWidth: 0,
    transform: [{ rotate: "45deg" }], marginLeft: -8, marginTop: 4
  },
  brandName: { color: "#FFFFFF", fontFamily: fonts.headingBold, fontSize: 44, letterSpacing: -1.5, marginTop: 10 },
  brandSub: { color: "#E0E7FF", fontFamily: fonts.body, fontSize: 16, letterSpacing: 0.5 },
  loader: { position: "absolute", bottom: 60, zIndex: 10 },
});
