import { Tabs } from "expo-router";
import { CreditCard, Users, Settings, User, Car } from "lucide-react-native";
import { colors, fonts } from "@/src/lib/theme";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, height: 78, paddingTop: 8, paddingBottom: 22 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Recargas", tabBarIcon: ({ color }) => <CreditCard size={22} color={color} /> }} />
      <Tabs.Screen name="users" options={{ title: "Usuarios", tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tabs.Screen name="carreras" options={{ title: "Carreras", tabBarIcon: ({ color }) => <Car size={22} color={color} /> }} />
      <Tabs.Screen name="config" options={{ title: "Config", tabBarIcon: ({ color }) => <Settings size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}
