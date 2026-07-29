import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { toast } from "@/src/components/Toast";
import { Phone, Shield, ArrowRight, X, Sparkles, Mail, Lock, User, ShieldAlert, ChevronRight, Eye, Play, Check, HelpCircle } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Tab Selector: Pasajero | Conductor | Empresa (02. BIENVENIDO)
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

  const quickFill = (role: "passenger" | "driver" | "admin") => {
    if (role === "passenger") {
      setActiveTab("passenger");
      setPhone("04141111111");
    }
    if (role === "driver") {
      setActiveTab("driver");
      setPhone("04142222222");
    }
    if (role === "admin") {
      setActiveTab("passenger");
      setPhone("00000000000");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header - Left Aligned Arrow Logo, Ruedalo Bold, Muévete contigo (02. BIENVENIDO) */}
        <View style={styles.topLogoArea}>
          <View style={styles.logoBadgeCircle}>
            <View style={styles.logoChevronSmall} />
          </View>
          <View style={styles.brandTextBlock}>
            <Text style={styles.brandTitleText}>Ruedalo</Text>
            <Text style={styles.brandSubText}>Muévete contigo.</Text>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeTextSection}>
          <Text style={styles.welcomeTitleText}>Bienvenido 👋</Text>
          <Text style={styles.welcomeDescText}>
            Inicia sesión o crea tu cuenta{"\n"}para solicitar tu próximo viaje.
          </Text>
        </View>

        {/* Roles Segment Selectors: Pasajero, Conductor, Empresa (02. BIENVENIDO) */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === "passenger" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("passenger")}
          >
            <User size={14} color={activeTab === "passenger" ? "#FFFFFF" : "#1E293B"} />
            <Text style={[styles.segmentBtnTxt, activeTab === "passenger" && styles.segmentBtnTxtActive]}>Pasajero</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === "driver" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("driver")}
          >
            <Eye size={14} color={activeTab === "driver" ? "#FFFFFF" : "#1E293B"} />
            <Text style={[styles.segmentBtnTxt, activeTab === "driver" && styles.segmentBtnTxtActive]}>Conductor</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === "company" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("company")}
          >
            <Sparkles size={14} color={activeTab === "company" ? "#FFFFFF" : "#1E293B"} />
            <Text style={[styles.segmentBtnTxt, activeTab === "company" && styles.segmentBtnTxtActive]}>Empresa</Text>
          </TouchableOpacity>
        </View>

        {/* Phone Input Field (02. BIENVENIDO) */}
        <View style={styles.phoneInputCard}>
          <View style={styles.phoneInputInner}>
            <Phone size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.textInputMain}
              placeholder="Número de teléfono"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              testID="login-phone-input"
            />
            <View style={styles.verticalDivider} />
            <View style={styles.countryDropdown}>
              <Text style={styles.countryCodeTxt}>+58</Text>
              <View style={styles.miniChevronDown} />
            </View>
          </View>
        </View>

        {/* Continue Button (02. BIENVENIDO) */}
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
              <ArrowRight size={18} color="#fff" style={styles.btnArrowRight} />
            </>
          )}
        </TouchableOpacity>

        {/* Or continue with line */}
        <View style={styles.orDividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerTxt}>o continúa con</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Buttons: Google, Apple, Facebook (02. BIENVENIDO) */}
        <View style={styles.socialBtnRow}>
          <TouchableOpacity style={styles.socialBtn} onPress={() => toast("Google Auth...", "info")}>
            <Text style={styles.socialEmoji}>🇬</Text>
            <Text style={styles.socialBtnTxt}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => toast("Apple Auth...", "info")}>
            <Text style={styles.socialEmoji}></Text>
            <Text style={styles.socialBtnTxt}>Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => toast("Facebook Auth...", "info")}>
            <Text style={styles.socialEmoji}>🇫</Text>
            <Text style={styles.socialBtnTxt}>Facebook</Text>
          </TouchableOpacity>
        </View>

        {/* Security / Priority Banner (02. BIENVENIDO - Exactly matches Blue card) */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyIconOuter}>
            <View style={styles.safetyIconInner}>
              <Check size={14} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.safetyTextCol}>
            <Text style={styles.safetyTitle}>Tu seguridad es nuestra prioridad</Text>
            <Text style={styles.safetySub}>Viajes verificados, soporte 24/7{"\n"}y tecnología avanzada.</Text>
          </View>
          <ChevronRight size={16} color={colors.primary} />
        </View>

        {/* Navigation / Signup Links */}
        <View style={styles.navLinkContainer}>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")} testID="goto-register-btn">
            <Text style={styles.signUpLink}>
              ¿No tienes cuenta? <Text style={styles.signUpLinkHighlight}>Crear cuenta</Text>
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.helpBtn} onPress={() => toast("Canal de ayuda abierto", "info")}>
            <HelpCircle size={16} color={colors.primary} />
            <Text style={styles.helpBtnTxt}>¿Necesitas ayuda?</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Banner: Ruedalo está disponible en tu ciudad (02. BIENVENIDO) */}
        <View style={styles.availableCard}>
          <View style={styles.availableHeaderRow}>
            {/* Custom styled blue sedan car shape */}
            <View style={styles.carDrawing}>
              <View style={styles.carRoof} />
              <View style={styles.carChassis} />
              <View style={styles.carWheel} />
              <View style={styles.carWheelRight} />
            </View>
            <View style={styles.availableTextCol}>
              <Text style={styles.availableTitle}>Ruedalo está disponible</Text>
              <Text style={styles.availableTitle}>en tu ciudad</Text>
            </View>
          </View>
          <View style={styles.availableFeaturesRow}>
            <Text style={styles.featureItem}>⚡ Rápido</Text>
            <Text style={styles.featureItem}>🛡️ Seguro</Text>
            <Text style={styles.featureItem}>✓ Confiable</Text>
          </View>
        </View>

        {/* Developer Test Suite Panel */}
        <View style={styles.testPanel}>
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

      {/* OTP verification Modal */}
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
              <Shield size={24} color={colors.success} />
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flexGrow: 1, padding: spacing.md, gap: spacing.md, backgroundColor: "#FFFFFF" },
  
  topLogoArea: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  logoBadgeCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoChevronSmall: { width: 14, height: 14, borderWidth: 3, borderColor: "#FFFFFF", borderLeftWidth: 0, borderBottomWidth: 0, transform: [{ rotate: "45deg" }], marginLeft: -3, marginTop: 1.5 },
  brandTextBlock: { gap: 1 },
  brandTitleText: { fontSize: 24, fontFamily: fonts.headingBold, color: colors.primary, letterSpacing: -1 },
  brandSubText: { fontSize: 13, fontFamily: fonts.body, color: colors.primary },

  welcomeTextSection: { marginTop: 16, marginBottom: 8, gap: 4 },
  welcomeTitleText: { fontSize: 28, fontFamily: fonts.headingBold, color: colors.textPrimary, letterSpacing: -0.5 },
  welcomeDescText: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 22 },

  segmentContainer: { flexDirection: "row", backgroundColor: colors.bg, borderRadius: radii.lg, padding: 4, marginVertical: 10, borderWidth: 1, borderColor: colors.border },
  segmentBtn: { flex: 1, flexDirection: "row", height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", gap: 6 },
  segmentBtnActive: { backgroundColor: colors.primary, ...shadows.btn },
  segmentBtnTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 13 },
  segmentBtnTxtActive: { color: "#FFFFFF", fontFamily: fonts.bodyBold },

  phoneInputCard: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: 16, height: 54, justifyContent: "center", marginTop: 10 },
  phoneInputInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  textInputMain: { flex: 1, color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 15 },
  verticalDivider: { width: 1, height: 24, backgroundColor: colors.border },
  countryDropdown: { flexDirection: "row", alignItems: "center", gap: 4 },
  countryCodeTxt: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  miniChevronDown: { width: 6, height: 6, borderWidth: 1.5, borderColor: colors.textPrimary, borderTopWidth: 0, borderLeftWidth: 0, transform: [{ rotate: "45deg" }], marginTop: -2, marginLeft: 2 },

  continueBtn: { backgroundColor: colors.primary, height: 52, borderRadius: radii.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, ...shadows.btn },
  continueBtnTxt: { color: "#FFFFFF", fontFamily: fonts.bodyBold, fontSize: 15 },
  btnArrowRight: { marginLeft: 2 },

  orDividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerTxt: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12 },

  socialBtnRow: { flexDirection: "row", gap: 10 },
  socialBtn: { flex: 1, flexDirection: "row", height: 46, borderRadius: radii.md, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 6 },
  socialEmoji: { fontSize: 14, color: "#111317" },
  socialBtnTxt: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 12 },

  // Safety Card Banner (02. BIENVENIDO)
  safetyCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#DBEAFE", borderRadius: radii.lg, padding: 14, marginVertical: 12, ...shadows.card },
  safetyIconOuter: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  safetyIconInner: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  safetyTextCol: { flex: 1, gap: 2 },
  safetyTitle: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 13 },
  safetySub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },

  navLinkContainer: { alignItems: "center", gap: 12, marginVertical: 8 },
  signUpLink: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  signUpLinkHighlight: { color: colors.primary, fontFamily: fonts.bodyBold },
  helpBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  helpBtnTxt: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 13 },

  // Available in city Card (02. BIENVENIDO)
  availableCard: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12, marginVertical: 10, ...shadows.card },
  availableHeaderRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  carDrawing: { width: 70, height: 40, position: "relative" },
  carRoof: { position: "absolute", top: 4, left: 16, width: 34, height: 16, backgroundColor: colors.primary, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  carChassis: { position: "absolute", bottom: 8, left: 4, width: 62, height: 16, backgroundColor: colors.primary, borderRadius: 4 },
  carWheel: { position: "absolute", bottom: 0, left: 14, width: 14, height: 14, borderRadius: 7, backgroundColor: "#111317", borderWidth: 3, borderColor: "#FFFFFF" },
  carWheelRight: { position: "absolute", bottom: 0, right: 14, width: 14, height: 14, borderRadius: 7, backgroundColor: "#111317", borderWidth: 3, borderColor: "#FFFFFF" },
  availableTextCol: { flex: 1, gap: 1 },
  availableTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 14, lineHeight: 18 },
  availableFeaturesRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  featureItem: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11 },

  testPanel: { backgroundColor: colors.elevated, padding: 14, borderRadius: radii.lg, gap: 10, marginTop: 8 },
  testPanelTitle: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
  testChipsRow: { flexDirection: "row", gap: 8 },
  testChip: { flex: 1, backgroundColor: colors.surface, height: 38, borderRadius: radii.full, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadows.card },
  testChipTxt: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: 22, paddingBottom: 40, gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18 },
  shieldBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", backgroundColor: "#ECFDF5", paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.full, marginTop: 4 },
  shieldTxt: { color: colors.success, fontFamily: fonts.bodyBold, fontSize: 11 },
  modalDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, textAlign: "center", paddingHorizontal: 10 },
  otpInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, height: 56, color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 22, textAlign: "center", letterSpacing: 8, marginVertical: 10 },
  modalVerifyBtn: { backgroundColor: colors.success, height: 48, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", ...shadows.neonSecondary },
  modalVerifyBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },
});
