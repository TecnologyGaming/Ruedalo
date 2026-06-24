import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing } from "@/src/lib/theme";
import { NeonButton } from "@/src/components/NeonButton";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";
import { Zap } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      toast("Completa todos los campos", "error");
      return;
    }
    try {
      setLoading(true);
      const u = await login(email.trim(), password);
      toast(`Bienvenido, ${u.name}`, "success");
      if (u.role === "passenger") router.replace("/(passenger)");
      else if (u.role === "driver") router.replace("/(driver)");
      else router.replace("/(admin)");
    } catch (e: any) {
      toast(e?.message ?? "No se pudo iniciar sesión", "error");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (role: "passenger" | "driver" | "admin") => {
    if (role === "passenger") { setEmail("pasajero@rideve.com"); setPassword("Demo1234!"); }
    if (role === "driver") { setEmail("conductor@rideve.com"); setPassword("Demo1234!"); }
    if (role === "admin") { setEmail("admin@rideve.com"); setPassword("Admin1234!"); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Zap size={28} color="#fff" />
            </View>
          </View>
          <Text style={styles.title}>RideVE</Text>
          <Text style={styles.subtitle}>Tu viaje en Venezuela, en segundos.</Text>
        </View>

        <View style={styles.form}>
          <FieldInput
            label="Correo"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            testID="login-email-input"
          />
          <FieldInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña"
            secureTextEntry
            testID="login-password-input"
          />
          <NeonButton title="Iniciar sesión" onPress={onLogin} loading={loading} testID="login-submit-btn" />
          <TouchableOpacity onPress={() => router.push("/(auth)/register")} testID="goto-register-btn">
            <Text style={styles.link}>¿No tienes cuenta? <Text style={{ color: colors.secondary }}>Crea una</Text></Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo rápida</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity style={styles.chip} onPress={() => quickFill("passenger")} testID="quick-passenger-btn">
              <Text style={styles.chipText}>Pasajero</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => quickFill("driver")} testID="quick-driver-btn">
              <Text style={styles.chipText}>Conductor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => quickFill("admin")} testID="quick-admin-btn">
              <Text style={styles.chipText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
  brand: { alignItems: "center", marginTop: 40, gap: 12 },
  logoOuter: {
    width: 84, height: 84, borderRadius: 999,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.primary,
    shadowColor: colors.primary, shadowOpacity: 0.7, shadowRadius: 22, elevation: 14,
  },
  logoInner: {
    width: 60, height: 60, borderRadius: 999, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 44, letterSpacing: 2, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14 },
  form: { gap: 14, marginTop: 20 },
  link: { color: colors.textSecondary, textAlign: "center", marginTop: 8, fontFamily: fonts.body },
  demoBox: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md, gap: 12 },
  demoTitle: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" },
  demoRow: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.secondary, alignItems: "center" },
  chipText: { color: colors.secondary, fontFamily: fonts.bodyBold, fontSize: 12 },
});
