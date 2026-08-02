import React, { useEffect } from "react";
import { View, StyleSheet, Text, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts } from "@/src/lib/theme";
import { RuedaloArrowLogo } from "@/src/components/RuedaloIcons";

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
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.splashGradientTop} />
      <LinearGradient
        colors={[colors.primaryDim, colors.primary]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* City Skyline - Caracas/Avila Silhouette */}
        <View style={styles.skylineContainer}>
          {/* Background mountains */}
          <View style={styles.mountainLayer1} />
          <View style={styles.mountainLayer2} />
          
          {/* Building blocks */}
          <View style={styles.buildingsLayer}>
            <View style={[styles.building, { height: 70, width: 24, left: "10%" }]} />
            <View style={[styles.building, { height: 110, width: 34, left: "18%" }]} />
            <View style={[styles.building, { height: 80, width: 22, left: "30%" }]} />
            <View style={[styles.building, { height: 130, width: 38, left: "38%" }]} />
            <View style={[styles.building, { height: 95, width: 26, left: "52%" }]} />
            <View style={[styles.building, { height: 60, width: 18, left: "68%" }]} />
            <View style={[styles.building, { height: 85, width: 30, left: "78%" }]} />
          </View>
          
          {/* Bridge structure at bottom */}
          <View style={styles.bridgeLayer}>
            <View style={styles.bridgePillar1} />
            <View style={styles.bridgePillar2} />
            <View style={styles.bridgePillar3} />
            <View style={styles.bridgeRoad} />
          </View>
        </View>

        {/* Centered Logo + Brand Text */}
        <View style={styles.brandContainer}>
          <Image 
            source={require('@/assets/images/ruedalo-logo-complete.png')}
            style={styles.logoImageSplash}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Indicator Bar (White bar from mockup) */}
        <View style={styles.bottomIndicator} />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  // Skyline Backdrop
  skylineContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    pointerEvents: "none",
  },
  
  mountainLayer1: {
    position: "absolute",
    bottom: 0,
    left: -40,
    right: -40,
    height: 160,
    backgroundColor: "#1A365D",
    borderRadius: 160,
    opacity: 0.4,
    transform: [{ rotate: "-2deg" }],
  },
  
  mountainLayer2: {
    position: "absolute",
    bottom: 0,
    left: -20,
    right: -20,
    height: 130,
    backgroundColor: "#152E52",
    borderRadius: 130,
    opacity: 0.8,
    transform: [{ rotate: "3deg" }],
  },
  
  buildingsLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  
  building: {
    position: "absolute",
    bottom: 0,
    backgroundColor: colors.splashSkyline,
    opacity: 0.35,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  
  bridgeLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  
  bridgePillar1: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    width: 4,
    height: 20,
    backgroundColor: "#FFFFFF",
    opacity: 0.3,
  },
  
  bridgePillar2: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: 4,
    height: 20,
    backgroundColor: "#FFFFFF",
    opacity: 0.3,
  },
  
  bridgePillar3: {
    position: "absolute",
    bottom: 0,
    right: "15%",
    width: 4,
    height: 20,
    backgroundColor: "#FFFFFF",
    opacity: 0.3,
  },
  
  bridgeRoad: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.25,
  },

  // Brand Content - Centered
  brandContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  
  logoImageSplash: {
    width: 300,
    height: 120,
    tintColor: '#FFFFFF',
  },

  // Bottom Indicator Bar (Exact 12px from mockup)
  bottomIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: "#FFFFFF",
  },
});
