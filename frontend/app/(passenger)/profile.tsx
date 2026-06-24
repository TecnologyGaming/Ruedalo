import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, User, Mail, Phone } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing } from "@/src/lib/theme";
import { NeonButton } from "@/src/components/NeonButton";

export default function PassengerProfile() {
  return <ProfileScreen />;
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarTxt}>{user?.name?.[0] ?? "U"}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === "passenger" ? "Pasajero" : user?.role === "driver" ? "Conductor" : "Admin"}</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Row icon={<Mail size={18} color={colors.secondary} />} label="Correo" value={user?.email ?? ""} />
        <Row icon={<Phone size={18} color={colors.secondary} />} label="Teléfono" value={user?.phone ?? ""} />
        <Row icon={<User size={18} color={colors.secondary} />} label="ID" value={user?.id?.slice(0, 8) ?? ""} />
      </View>
      <View style={styles.actions}>
        <NeonButton title="Cerrar sesión" variant="danger" icon={<LogOut size={18} color="#fff" />} onPress={onLogout} testID="logout-btn" />
      </View>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", padding: spacing.lg, gap: 8 },
  avatar: { width: 90, height: 90, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: colors.primary, shadowOpacity: 0.7, shadowRadius: 20, elevation: 10 },
  avatarTxt: { color: "#fff", fontFamily: fonts.headingBold, fontSize: 36 },
  name: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 24, marginTop: 6 },
  roleBadge: { backgroundColor: colors.surface, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.secondary },
  roleText: { color: colors.secondary, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" },
  card: { marginHorizontal: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  rowLabel: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  rowValue: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 14, marginTop: 2 },
  actions: { padding: spacing.md, marginTop: "auto" },
});
