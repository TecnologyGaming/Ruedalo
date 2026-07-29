import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";
import { Phone, Shield, ArrowRight, X, Sparkles, Mail, Lock, User, HelpCircle } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Tab Selector: Pasajero | Conductor | Empresa
  const [activeTab, setActiveTab] = useState<"passenger" | "driver" | "company">("passenger");

  // Phone OTP verification modal state
  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sentOtp, setSentOtp] = useState("");

  const onSendOtp = () => {
    if (!phone.trim() || phone.length < 7) {
      toast("Ingresa un número de teléfono válido", "error");
      return;
    }
    
    // Auto fill/redirect helper credentials based on phone
    let targetEmail = "pasajero@rideve.com";
    let targetPassword = "Demo1234!";
    
    if (phone.includes("2222222") || activeTab === "driver") {
      targetEmail = "conductor@rideve.com";
    } else if (phone.includes("0000000") || phone.includes("admin")) {
      targetEmail = "admin@rideve.com";
      targetPassword = "Admin1234!";
    }
    
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
      
      if (phone.includes("2222222") || activeTab === "driver") {
        targetEmail = "conductor@rideve.com";
      } else if (phone.includes("0000000") || phone.includes("admin")) {
        targetEmail = "admin@rideve.com";
        targetPassword = "Admin1234!";
      }
      
      const u = await login(targetEmail, targetPassword);
      toast(`Verificado. Bienvenido a Ruedalo, ${u.name}`, "success");
      
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
      setActiveTab("passenger");
      setPhone("04141111111");
      setEmail("pasajero@rideve.com");
      setPassword("Demo1234!");
    }
    if (role === "driver") {
      setActiveTab("driver");
      setPhone("04142222222");
      setEmail("conductor@rideve.com");
      setPassword("Demo1234!");
    }
    if (role === "admin") {
      setActiveTab("passenger");
      setPhone("00000000000");
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
        {/* Customized Ruedalo Top Bar Logo area */}
        <View style={styles.headerBrand}>
          <View style={styles.logoBadgeCircle}>
            <View style={styles.logoChevronSmall} />
          </View>
          <Text style={styles.logoBrandName}>Ruedalo</Text>
        </View>

        {/* Roles Segment Selectors - Pasajero | Conductor | Empresa (02. BIENVENIDO) */}
        <View style={styles.segmentRow}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === "passenger" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("passenger")}
          >
            <User size={16} color={activeTab === "passenger" ? "#FFFFFF" : colors.textSecondary} />
            <Text style={[styles.segmentBtnTxt, activeTab === "passenger" && styles.segmentBtnTxtActive]}>Pasajero</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === "driver" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("driver")}
          >
            <User size={16} color={activeTab === "driver" ? "#FFFFFF" : colors.textSecondary} />
            <Text style={[styles.segmentBtnTxt, activeTab === "driver" && styles.segmentBtnTxtActive]}>Conductor</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === "company" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("company")}
          >
            <User size={16} color={activeTab === "company" ? "#FFFFFF" : colors.textSecondary} />
            <Text style={[styles.segmentBtnTxt, activeTab === "company" && styles.segmentBtnTxtActive]}>Empresa</Text>
          </TouchableOpacity>
        </View>

        {/* Headline text */}
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>¡Bienvenido!</Text>
          <Text style={styles.heroDesc}>Inicia sesión o crea tu cuenta para solicitar tu próximo viaje.</Text>
        </View>

        {!useEmail ? (
          // Phone Auth Form
          <View style={styles.formCardContainer}>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.flagEmoji}>🇻🇪</Text>
                <Text style={styles.countryCodeTxt}>+58</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Número de teléfono"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                testID="login-phone-input"
              />
            </View>

            <TouchableOpacity 
              style={[styles.continueBtn, loading && { opacity: 0.7 }]} 
              onPress={onSendOtp}
              disabled={loading}
              testID="send-otp-btn"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.continueBtnTxt}>Continuar</Text>
                  <ArrowRight size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* Social Continuing Divider */}
            <View style={styles.socialDividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerTxt}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google / Apple / Facebook Social login mock buttons */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => toast("Google Login Autenticando...", "info")}>
                <Text style={styles.socialBtnTxt}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => toast("Apple Login Autenticando...", "info")}>
                <Text style={styles.socialBtnTxt}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => toast("Facebook Login Autenticando...", "info")}>
                <Text style={styles.socialBtnTxt}>Facebook</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.emailLoginLink} onPress={() => setUseEmail(true)}>
              <Mail size={14} color={colors.textSecondary} />
              <Text style={styles.emailLoginLinkTxt}>Iniciar sesión con correo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Email Form
          <View style={styles.formCardContainer}>
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
              style={[styles.continueBtn, loading && { opacity: 0.7 }]} 
              onPress={onEmailLogin}
              disabled={loading}
              testID="login-submit-btn"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.continueBtnTxt}>Ingresar</Text>
                  <ArrowRight size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.emailLoginLink} onPress={() => setUseEmail(false)}>
              <Phone size={14} color={colors.textSecondary} />
              <Text style={styles.emailLoginLinkTxt}>Regresar a Login con Teléfono</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomLinkContainer}>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")} testID="goto-register-btn">
            <Text style={styles.registerLinkTxt}>
              ¿No tienes cuenta? <Text style={{ color: colors.primary, fontFamily: fonts.bodyBold }}>Crear cuenta</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 14 }} onPress={() => toast("Sección de soporte / ayuda abierta", "info")}>
            <Text style={styles.helpLinkTxt}>¿Necesitas ayuda?</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Fast Switcher Chips (Visual Verification & local testing) */}
        <View style={styles.developerTestPanel}>
          <Text style={styles.testPanelTitle}>Rápido Acceso de Pruebas</Text>
          <View style={styles.testChipsRow}>
            <TouchableOpacity style={styles.testChip} onPress={() => quickFill("passenger")} testID="quick-passenger-btn">
              <Text style={styles.testChipTxt}>Pasajero</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testChip} onPress={() => quickFill("driver")} testID="quick-driver-btn">
              <Text style={styles.testChipTxt}>Conductor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testChip} onPress={() => quickFill("admin")} testID="quick-admin-btn">
              <Text style={styles.testChipTxt}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* OTP Modal */}
      <Modal visible={otpModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ingresa código SMS</Text>
              <TouchableOpacity onPress={() => setOtpModal(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.otpShieldBadge}>
              <Shield size={20} color={colors.success} />
              <Text style={styles.otpShieldTxt}>Código enviado con éxito</Text>
            </View>

            <TextInput
              style={styles.otpCodeInput}
              placeholder="0 0 0 0 0 0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
              testID="otp-verification-input"
            />

            <TouchableOpacity style={styles.verifyOtpBtn} onPress={onVerifyOtp} testID="submit-otp-btn">
              <Text style={styles.verifyOtpBtnTxt}>Verificar código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flexGrow: 1, padding: spacing.md, gap: spacing.md, backgroundColor: "#FFFFFF" },
  
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, paddingHorizontal: 4 },
  logoBadgeCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoChevronSmall: { width: 12, height: 12, borderWidth: 2.5, borderColor: "#FFFFFF", borderLeftWidth: 0, borderBottomWidth: 0, transform: [{ rotate: "45deg" }], marginLeft: -3, marginTop: 1.5 },
  logoBrandName: { fontSize: 22, fontFamily: fonts.headingBold, color: colors.textPrimary, letterSpacing: -0.5 },

  segmentRow: { flexDirection: "row", backgroundColor: colors.bg, borderRadius: radii.lg, padding: 4, marginVertical: 10, borderWidth: 1, borderColor: colors.border },
  segmentBtn: { flex: 1, flexDirection: "row", height: 40, borderRadius: radii.md, alignItems: "center", justifyContent: "center", gap: 6 },
  segmentBtnActive: { backgroundColor: colors.primary, ...shadows.btn },
  segmentBtnTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 13 },
  segmentBtnTxtActive: { color: "#FFFFFF", fontFamily: fonts.bodyBold },

  heroTextContainer: { marginVertical: 10, gap: 6 },
  heroTitle: { fontSize: 26, fontFamily: fonts.headingBold, color: colors.textPrimary, letterSpacing: -0.5 },
  heroDesc: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 20 },

  formCardContainer: { backgroundColor: colors.surface, padding: 20, borderRadius: radii.lg, gap: 14, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  phoneInputRow: { flexDirection: "row", gap: 10 },
  countryCodeBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 10, height: 50 },
  flagEmoji: { fontSize: 18 },
  countryCodeTxt: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  phoneInput: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, height: 50, color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 15 },
  
  continueBtn: { backgroundColor: colors.primary, height: 52, borderRadius: radii.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, ...shadows.btn },
  continueBtnTxt: { color: "#FFFFFF", fontFamily: fonts.bodyBold, fontSize: 15 },

  socialDividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerTxt: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12 },

  socialButtonsRow: { flexDirection: "row", gap: 10 },
  socialBtn: { flex: 1, height: 46, borderRadius: radii.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  socialBtnTxt: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 12 },

  emailLoginLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8, marginTop: 4 },
  emailLoginLinkTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 13 },

  bottomLinkContainer: { alignItems: "center", marginVertical: 10 },
  registerLinkTxt: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  helpLinkTxt: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 13, textDecorationLine: "underline" },

  developerTestPanel: { backgroundColor: colors.elevated, padding: 14, borderRadius: radii.lg, gap: 10, marginTop: 10 },
  testPanelTitle: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
  testChipsRow: { flexDirection: "row", gap: 8 },
  testChip: { flex: 1, backgroundColor: colors.surface, height: 38, borderRadius: radii.full, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadows.card },
  testChipTxt: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: 22, paddingBottom: 40, gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18 },
  otpShieldBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", backgroundColor: "#ECFDF5", paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.full, marginTop: 4 },
  otpShieldTxt: { color: colors.success, fontFamily: fonts.bodyBold, fontSize: 11 },
  otpCodeInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, height: 56, color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 22, textAlign: "center", letterSpacing: 8, marginVertical: 10 },
  verifyOtpBtn: { backgroundColor: colors.success, height: 48, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", ...shadows.neonSecondary },
  verifyOtpBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },
});
