import { Tabs } from "expo-router";
import { Home, DollarSign, ClipboardList, User } from "lucide-react-native";
import { colors, fonts } from "@/src/lib/theme";

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, height: 78, paddingTop: 8, paddingBottom: 22 },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Conducir", tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="earnings" options={{ title: "Ganancias", tabBarIcon: ({ color }) => <DollarSign size={22} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: "Historial", tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}
