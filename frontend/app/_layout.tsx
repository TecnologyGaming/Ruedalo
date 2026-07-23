import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { useEffect, useState } from "react";
import { LogBox, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider } from "@/src/lib/auth";
import { ToastHost } from "@/src/components/Toast";
import { colors } from "@/src/lib/theme";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

const FONT_URLS: Record<string, string> = {
  Outfit: "https://fonts.gstatic.com/s/outfit/v11/QGYvz_MVcBeNP4NJrktqe5pcSCk.ttf",
  "Outfit-Bold": "https://fonts.gstatic.com/s/outfit/v11/QGYvz_MVcBeNP4NJLktqe5pcSCk.ttf",
  DMSans: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAop9wzg.ttf",
  "DMSans-Medium": "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwApJlwzg.ttf",
  "DMSans-Bold": "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAoJ5wzg.ttf",
};

export default function RootLayout() {
  const [iconsLoaded, iconErr] = useIconFonts();
  const [appFontsLoaded, setAppFontsLoaded] = useState(false);

  useEffect(() => {
    // non-blocking font load; if it fails, system fallback is used
    Font.loadAsync(FONT_URLS).catch(() => {}).finally(() => setAppFontsLoaded(true));
  }, []);

  useEffect(() => {
    if ((iconsLoaded || iconErr) && appFontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [iconsLoaded, iconErr, appFontsLoaded]);

  if (!iconsLoaded && !iconErr) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
              <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.bg } }} />
              <ToastHost />
            </View>
          </AuthProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
