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
import { ArrowLeft, User, Car } from "lucide-react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      toast("Completa todos los campos", "error");
      return;
    }
    if (password.length < 6) {
      toast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    try {
      setLoading(true);
      const u = await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, role });
      toast(`Cuenta creada, bienvenido ${u.name}`, "success");
      if (u.role === "passenger") router.replace("/(passenger)");
      else router.replace("/(driver)");
    } catch (e: any) {
      toast(e?.message ?? "No se pudo registrar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} bottomOffset={20} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()} testID="back-btn">
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Únete a RideVE en menos de 30 segundos.</Text>

        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, role === "passenger" && styles.roleCardActiveP]}
            onPress={() => setRole("passenger")}
            testID="role-passenger-btn"
          >
            <User size={26} color={role === "passenger" ? colors.primary : colors.textSecondary} />
            <Text style={[styles.roleText, role === "passenger" && { color: colors.primary }]}>Pasajero</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleCard, role === "driver" && styles.roleCardActiveS]}
            onPress={() => setRole("driver")}
            testID="role-driver-btn"
          >
            <Car size={26} color={role === "driver" ? colors.secondary : colors.textSecondary} />
            <Text style={[styles.roleText, role === "driver" && { color: colors.secondary }]}>Conductor</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <FieldInput label="Nombre completo" value={name} onChangeText={setName} placeholder="Tu nombre" testID="register-name-input" />
          <FieldInput label="Correo" value={email} onChangeText={setEmail} placeholder="tu@correo.com" autoCapitalize="none" keyboardType="email-address" testID="register-email-input" />
          <FieldInput label="Teléfono" value={phone} onChangeText={setPhone} placeholder="0414-1234567" keyboardType="phone-pad" testID="register-phone-input" />
          <FieldInput label="Contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" secureTextEntry testID="register-password-input" />
          <NeonButton title="Crear cuenta" onPress={onSubmit} loading={loading} testID="register-submit-btn" />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  back: { width: 42, height: 42, borderRadius: 999, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 32, letterSpacing: 0.5, marginTop: 8 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14 },
  roleRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  roleCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: radii.lg, padding: 20, alignItems: "center", gap: 8 },
  roleCardActiveP: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  roleCardActiveS: { borderColor: colors.secondary, shadowColor: colors.secondary, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  roleText: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 0.5 },
  form: { gap: 12, marginTop: 12 },
});
