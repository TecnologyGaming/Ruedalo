import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { api, setToken } from "@/src/lib/api";
import { toast } from "@/src/components/Toast";
import { Lock, User } from "lucide-react-native";

export default function DonatexAdminRoute() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!username.trim() || !password) {
      toast("Ingresa tu usuario y contraseña", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api<any>("/auth/login", {
        method: "POST",
        body: { email: username.trim(), password },
        auth: false
      });

      if (res.user.role !== "admin") {
        toast("Acceso denegado: Rol no autorizado", "error");
        setLoading(false);
        return;
      }

      await setToken(res.access_token);
      setUser(res.user);
      toast("Acceso administrativo concedido", "success");
      router.replace("/(admin)");
    } catch (e: any) {
      toast(e?.message ?? "Credenciales incorrectas", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ruedalo Admin</Text>
        <Text style={styles.subtitle}>Acceso de seguridad (Donatex)</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <User size={18} color={colors.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Usuario o Correo"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              testID="donatex-username-input"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={18} color={colors.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              testID="donatex-password-input"
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleAdminLogin} disabled={loading} testID="donatex-submit-btn">
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
  },
  card: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 6,
  },
  title: {
    color: "#fff",
    fontFamily: fonts.headingBold,
    fontSize: 22,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#020617",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: fonts.body,
    fontSize: 14,
  },
  btn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnText: {
    color: "#fff",
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
