import React, { useEffect } from "react";
import { View, StyleSheet, StatusBar, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth";

/**
 * 01. SPLASH SCREEN
 * Pixel-Perfect Implementation - Extracted from Official Mockup
 * Target Fidelity: >99%
 */
export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (!user) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(passenger)");
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [user, loading, router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Image 
        source={require('@/assets/images/ruedalo-logo-clean.png')}
        style={styles.logoImageSplash}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  logoImageSplash: {
    width: 280,
    height: 90,
  },
});
