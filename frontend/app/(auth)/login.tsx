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
        {/* Logo and country picker row styled like Yango */}
        <View style={styles.rideryLogoArea}>
          <Text style={styles.rideryBrand}>Yango <Text style={{ color: colors.primary, fontSize: 14 }}>●</Text></Text>
          <View style={styles.globeIcon}><Text style={{ fontSize: 16 }}>🌐</Text></View>
        </View>

        {/* Hero Illustration with Yango Red Car and bold competitor layout */}
        <View style={styles.heroSection}>
          <View style={styles.headlineContainer}>
            <Text style={styles.headlineMain}>CONFIABLES Y</Text>
            <Text style={styles.headlineMain}>ECONÓMICOS</Text>
            <Text style={[styles.headlineMain, { color: colors.primary }]}>VIAJES</Text>
          </View>
          
          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationFloorShadow} />
            <View style={styles.illustrationMotorcycle}>
              {/* Sleek Yango Red Passenger Car illustration */}
              <View style={styles.carChassis} />
              <View style={styles.carCab} />
              <View style={styles.carWindowFront} />
              <View style={styles.carWindowBack} />
              <View style={styles.carWheelBack} />
              <View style={styles.carWheelFront} />
              <View style={styles.carLightFront} />
              <View style={styles.carTaxiSign}><Text style={styles.carTaxiSignTxt}>TAXI</Text></View>
            </View>
          </View>
        </View>

        {!useEmail ? (
          // Phone Auth Form (Default)
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Ingresa tu número de teléfono</Text>
            <Text style={styles.formDesc}>Recibe un código SMS para verificar tu cuenta en segundos.</Text>
            
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇻🇪</Text>
                <Text style={styles.countryCodeTxt}>+58</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="424 1234567"
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
          <TouchableOpacity style={{ marginTop: 8 }} onPress={() => router.push("/(passenger)/profile")}>
            <Text style={styles.conductorLink}>Quiero ser conductor de RideVE</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Fast Account Switcher */}
        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Acceso de Demostración Rápido</Text>
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
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flexGrow: 1, padding: spacing.md, justifyContent: "space-between", gap: spacing.md, backgroundColor: "#FFFFFF" },
  
  rideryLogoArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingHorizontal: 4 },
  rideryBrand: { fontSize: 28, fontFamily: fonts.headingBold, color: "#111317", letterSpacing: -0.5 },
  globeIcon: { width: 34, height: 34, borderRadius: 999, backgroundColor: "#F1F2F6", alignItems: "center", justifyContent: "center" },

  heroSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 14 },
  headlineContainer: { gap: 2, flex: 1.1 },
  headlineMain: { fontSize: 26, fontFamily: fonts.headingBold, color: "#111317", lineHeight: 30, letterSpacing: -1 },

  // Yango Red Passenger Taxi Car Illustration
  illustrationContainer: { flex: 1.2, height: 150, position: "relative", justifyContent: "center", alignItems: "center" },
  illustrationFloorShadow: { width: 110, height: 10, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.06)", position: "absolute", bottom: 20 },
  illustrationMotorcycle: { width: 100, height: 80, position: "relative" },
  carChassis: { position: "absolute", bottom: 15, left: 10, width: 80, height: 22, backgroundColor: colors.primary, borderRadius: 6 },
  carCab: { position: "absolute", bottom: 33, left: 24, width: 44, height: 18, backgroundColor: "#1E293B", borderTopLeftRadius: 10, borderTopRightRadius: 12 },
  carWindowFront: { position: "absolute", bottom: 35, right: 34, width: 16, height: 12, backgroundColor: "#FFFFFF", borderTopRightRadius: 8, opacity: 0.8 },
  carWindowBack: { position: "absolute", bottom: 35, left: 28, width: 16, height: 12, backgroundColor: "#FFFFFF", borderTopLeftRadius: 6, opacity: 0.8 },
  carWheelBack: { position: "absolute", bottom: 6, left: 18, width: 22, height: 22, borderRadius: 999, backgroundColor: "#F1F2F6", borderWidth: 4, borderColor: "#111317" },
  carWheelFront: { position: "absolute", bottom: 6, right: 18, width: 22, height: 22, borderRadius: 999, backgroundColor: "#F1F2F6", borderWidth: 4, borderColor: "#111317" },
  carLightFront: { position: "absolute", bottom: 22, right: 10, width: 6, height: 8, backgroundColor: "#FBBF24", borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  carTaxiSign: { position: "absolute", bottom: 50, left: 38, backgroundColor: "#FFB800", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2, borderWidth: 1, borderColor: "#111317" },
  carTaxiSignTxt: { color: "#111317", fontSize: 6, fontFamily: fonts.headingBold },

  formContainer: { backgroundColor: colors.surface, padding: 20, borderRadius: radii.xl, gap: 14, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  formTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 16, letterSpacing: -0.2 },
  formDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  phoneInputRow: { flexDirection: "row", gap: 10 },
  countryCode: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 10, height: 50 },
  flag: { fontSize: 18 },
  countryCodeTxt: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  phoneInput: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, height: 50, color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 15 },
  primaryBtn: { backgroundColor: colors.primary, height: 52, borderRadius: radii.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, ...shadows.neonPrimary },
  primaryBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },
  secondaryLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8, marginTop: 2 },
  secondaryLinkTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 13 },
  
  footer: { alignItems: "center", gap: 6 },
  registerLink: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  registerLinkHighlight: { color: colors.secondary, fontFamily: fonts.bodyBold },
  conductorLink: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 13, textDecorationLine: "underline" },

  demoContainer: { backgroundColor: colors.elevated, padding: 14, borderRadius: radii.lg, gap: 10, marginTop: 6 },
  demoTitle: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
  demoChipsRow: { flexDirection: "row", gap: 8 },
  demoChip: { flex: 1, backgroundColor: colors.surface, height: 38, borderRadius: radii.full, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadows.card },
  demoChipTxt: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 11 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: 22, paddingBottom: 40, gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18 },
  shieldBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", backgroundColor: "#ECFDF5", paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.full, marginTop: 4 },
  shieldTxt: { color: colors.success, fontFamily: fonts.bodyBold, fontSize: 11 },
  modalDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, textAlign: "center", paddingHorizontal: 10 },
  otpInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, height: 56, color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 22, textAlign: "center", letterSpacing: 8, marginVertical: 10 },
  modalVerifyBtn: { backgroundColor: colors.success, height: 48, borderRadius: radii.xl, alignItems: "center", justifyContent: "center", ...shadows.neonSecondary },
  modalVerifyBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },
  resendCodeTxt: { color: colors.secondary, fontFamily: fonts.bodyBold, fontSize: 13, textAlign: "center", marginTop: 4 },
});
