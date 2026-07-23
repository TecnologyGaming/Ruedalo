import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { NeonButton } from "@/src/components/NeonButton";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";
import { Phone, Shield, ArrowRight, X, Sparkles, Mail, Lock } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Phone OTP verification modal state
  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [selectedRoleForPhone, setSelectedRoleForPhone] = useState<"passenger" | "driver" | "admin">("passenger");

  const onSendOtp = () => {
    if (!phone.trim() || phone.length < 7) {
      toast("Ingresa un número de teléfono válido", "error");
      return;
    }
    
    // Simulate finding account based on phone suffix or prefix
    let targetEmail = "pasajero@rideve.com";
    let targetPassword = "Demo1234!";
    let roleName: "passenger" | "driver" | "admin" = "passenger";
    
    if (phone.includes("2222222") || phone.includes("driver")) {
      targetEmail = "conductor@rideve.com";
      roleName = "driver";
    } else if (phone.includes("0000000") || phone.includes("admin")) {
      targetEmail = "admin@rideve.com";
      targetPassword = "Admin1234!";
      roleName = "admin";
    }
    
    setSelectedRoleForPhone(roleName);
    
    // Generate simulated code
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(mockCode);
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setOtpModal(true);
      toast(`[Firebase Auth SMS] Código enviado: ${mockCode}`, "success", { duration: 6000 });
    }, 1200);
  };

  const onVerifyOtp = async () => {
    if (otpCode !== sentOtp && otpCode !== "123456") {
      toast("Código de verificación incorrecto", "error");
      return;
    }
    
    try {
      setLoading(true);
      setOtpModal(false);
      
      let targetEmail = "pasajero@rideve.com";
      let targetPassword = "Demo1234!";
      
      if (selectedRoleForPhone === "driver") {
        targetEmail = "conductor@rideve.com";
      } else if (selectedRoleForPhone === "admin") {
        targetEmail = "admin@rideve.com";
        targetPassword = "Admin1234!";
      }
      
      const u = await login(targetEmail, targetPassword);
      toast(`Verificado. Bienvenido, ${u.name}`, "success");
      
      if (u.role === "passenger") router.replace("/(passenger)");
      else if (u.role === "driver") router.replace("/(driver)");
      else router.replace("/(admin)");
    } catch (e: any) {
      toast(e?.message ?? "Error al iniciar sesión", "error");
    } finally {
      setLoading(false);
    }
  };

  const onEmailLogin = async () => {
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
    if (role === "passenger") {
      setPhone("0414-1111111");
      setEmail("pasajero@rideve.com");
      setPassword("Demo1234!");
    }
    if (role === "driver") {
      setPhone("0414-2222222");
      setEmail("conductor@rideve.com");
      setPassword("Demo1234!");
    }
    if (role === "admin") {
      setPhone("0000-0000000");
      setEmail("admin@rideve.com");
      setPassword("Admin1234!");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Sparkles size={20} color={colors.primary} />
            <Text style={styles.logoBadgeTxt}>RideVE Premium</Text>
          </View>
          <Text style={styles.title}>Viaja seguro y rápido</Text>
          <Text style={styles.subtitle}>La app de movilidad número uno para Venezuela</Text>
        </View>

        {!useEmail ? (
          // Phone Auth Form (Default)
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Ingresa tu número de teléfono</Text>
            <Text style={styles.formDesc}>Te enviaremos un código SMS para verificar tu identidad.</Text>
            
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇻🇪</Text>
                <Text style={styles.countryCodeTxt}>+58</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="414 1234567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                testID="login-phone-input"
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]} 
              onPress={onSendOtp}
              disabled={loading}
              testID="send-otp-btn"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnTxt}>Continuar con teléfono</Text>
                  <ArrowRight size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryLink} onPress={() => setUseEmail(true)}>
              <Mail size={16} color={colors.textSecondary} />
              <Text style={styles.secondaryLinkTxt}>Iniciar sesión con correo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Email/Password Form
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Iniciar sesión</Text>
            <Text style={styles.formDesc}>Ingresa tus credenciales registradas para acceder.</Text>
            
            <FieldInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={colors.textSecondary} />}
              testID="login-email-input"
            />
            
            <FieldInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              secureTextEntry
              leftIcon={<Lock size={18} color={colors.textSecondary} />}
              testID="login-password-input"
            />

            <TouchableOpacity 
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]} 
              onPress={onEmailLogin}
              disabled={loading}
              testID="login-submit-btn"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnTxt}>Ingresar</Text>
                  <ArrowRight size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryLink} onPress={() => setUseEmail(false)}>
              <Phone size={16} color={colors.textSecondary} />
              <Text style={styles.secondaryLinkTxt}>Regresar a Login con Teléfono</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")} testID="goto-register-btn">
            <Text style={styles.registerLink}>
              ¿No tienes cuenta? <Text style={styles.registerLinkHighlight}>Crea una aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Fast Account Switcher */}
        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Cuentas de demostración</Text>
          <View style={styles.demoChipsRow}>
            <TouchableOpacity style={styles.demoChip} onPress={() => quickFill("passenger")} testID="quick-passenger-btn">
              <Text style={styles.demoChipTxt}>Pasajero</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoChip} onPress={() => quickFill("driver")} testID="quick-driver-btn">
              <Text style={styles.demoChipTxt}>Conductor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoChip} onPress={() => quickFill("admin")} testID="quick-admin-btn">
              <Text style={styles.demoChipTxt}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* OTP Verification Modal */}
      <Modal visible={otpModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verifica tu teléfono</Text>
              <TouchableOpacity onPress={() => setOtpModal(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.shieldBadge}>
              <Shield size={28} color={colors.success} />
              <Text style={styles.shieldTxt}>Código de seguridad enviado</Text>
            </View>

            <Text style={styles.modalDesc}>
              Hemos enviado un código SMS de 6 dígitos a tu número <Text style={{ fontFamily: fonts.bodyBold }}>+58 {phone}</Text>.
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="0 0 0 0 0 0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
              testID="otp-verification-input"
            />

            <TouchableOpacity style={styles.modalVerifyBtn} onPress={onVerifyOtp} testID="submit-otp-btn">
              <Text style={styles.modalVerifyBtnTxt}>Verificar código</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => toast(`Tu código es: ${sentOtp}`, "info")}>
              <Text style={styles.resendCodeTxt}>Reenviar código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: "space-between", gap: spacing.lg },
  header: { marginTop: 40, alignItems: "center", gap: 10 },
  logoBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.elevated, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.full },
  logoBadgeTxt: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 30, textAlign: "center", letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, textAlign: "center", paddingHorizontal: 12 },
  formContainer: { backgroundColor: colors.surface, padding: 24, borderRadius: radii.xl, gap: 16, ...shadows.card },
  formTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18 },
  formDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, marginBottom: 8 },
  phoneInputRow: { flexDirection: "row", gap: 12 },
  countryCode: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 12, height: 52 },
  flag: { fontSize: 18 },
  countryCodeTxt: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15 },
  phoneInput: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 16, height: 52, color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 16 },
  primaryBtn: { backgroundColor: colors.primary, height: 54, borderRadius: radii.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, ...shadows.neonPrimary },
  primaryBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 16 },
  secondaryLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, marginTop: 4 },
  secondaryLinkTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 14 },
  footer: { alignItems: "center" },
  registerLink: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14 },
  registerLinkHighlight: { color: colors.primary, fontFamily: fonts.bodyBold },
  demoContainer: { backgroundColor: colors.elevated, padding: 16, borderRadius: radii.lg, gap: 12, marginTop: 10 },
  demoTitle: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
  demoChipsRow: { flexDirection: "row", gap: 8 },
  demoChip: { flex: 1, backgroundColor: colors.surface, height: 40, borderRadius: radii.full, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadows.card },
  demoChipTxt: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: 24, paddingBottom: 48, gap: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 20 },
  shieldBadge: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center", backgroundColor: "#ECFDF5", paddingVertical: 8, paddingHorizontal: 16, borderRadius: radii.full, marginTop: 8 },
  shieldTxt: { color: colors.success, fontFamily: fonts.bodyBold, fontSize: 12 },
  modalDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, textAlign: "center", paddingHorizontal: 12 },
  otpInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, height: 60, color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 24, textAlign: "center", letterSpacing: 8, marginVertical: 12 },
  modalVerifyBtn: { backgroundColor: colors.success, height: 52, borderRadius: radii.xl, alignItems: "center", justifyContent: "center", ...shadows.neonSecondary },
  modalVerifyBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 16 },
  resendCodeTxt: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 14, textAlign: "center", marginTop: 8 },
});
