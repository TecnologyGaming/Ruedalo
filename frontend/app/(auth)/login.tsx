import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, StatusBar, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { toast } from "@/src/components/Toast";
import { Phone, Shield, ArrowRight, X, User, ChevronRight, Check } from "lucide-react-native";
import { RuedaloArrowLogo, SteeringWheelIcon, GoogleLogo, AppleLogo, FacebookLogo, BriefcaseIcon } from "@/src/components/RuedaloIcons";

// Import Firebase real phone auth modules
import { getAuth, verifyPhoneNumber, PhoneAuthProvider, signInWithCredential } from "@/src/utils/firebaseAuthHelper";

// Import API and setToken helpers
import { api, setToken } from "@/src/lib/api";

/**
 * 02. BIENVENIDO / LOGIN SCREEN
 * Pixel-Perfect Implementation - Extracted from Official Mockup
 * Target Fidelity: >99%
 */


export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Tab Selector: Pasajero | Conductor | Empresa
  const [activeTab, setActiveTab] = useState<"passenger" | "driver" | "company">("passenger");

  // Phone OTP verification modal state
  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const handleBackendPhoneLogin = async (verifiedPhone: string) => {
    setLoading(true);
    try {
      const res = await api<any>("/auth/phone-login", {
        method: "POST",
        body: { phone: verifiedPhone },
        auth: false
      });
      
      await setToken(res.access_token);
      setUser(res.user);
      toast(`¡Bienvenido de vuelta a Ruedalo!`, "success");
      setOtpModal(false);
      
      if (res.user.role === "passenger") router.replace("/(passenger)");
      else if (res.user.role === "driver") router.replace("/(driver)");
      else router.replace("/(admin)");
    } catch (apiErr: any) {
      if (apiErr.status === 404) {
        toast("Teléfono verificado. Por favor, completa tu registro.", "info");
        setOtpModal(false);
        router.push({
          pathname: "/(auth)/register",
          params: { phone: verifiedPhone }
        });
      } else {
        toast(apiErr?.message ?? "Error en el servidor de Ruedalo", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSendOtp = async () => {
    if (!phone.trim() || phone.length < 7) {
      toast("Ingresa un número de teléfono válido", "error");
      return;
    }
    
    setLoading(true);

    try {
      let cleanPhone = phone.replace(/[-\s]/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1);
      }
      const formattedPhone = `+58${cleanPhone}`;
      
      if (Platform.OS === 'web') {
        console.log("[Firebase Auth] Web platform detected - SMS is only supported in native APK.");
        toast("SMS no soportado en Web. Por favor, prueba en la APK nativa.", "error");
        setLoading(false);
      } else {
        console.log("[Firebase Auth] verifyPhoneNumber started for phone:", formattedPhone);
        
        verifyPhoneNumber(getAuth(), formattedPhone)
          .on('state_changed', async (snapshot: any) => {
            console.log("[Firebase Auth] Native state changed:", snapshot.state);
            
            if (snapshot.state === 'sent' || snapshot.state === 'code_sent') {
              console.log("[Firebase Auth] sent - verificationId received:", snapshot.verificationId);
              setVerificationId(snapshot.verificationId);
              setLoading(false);
              setOtpModal(true);
              toast("Código enviado por SMS nativo a tu teléfono", "success");
            } 
            else if (snapshot.state === 'verified' || snapshot.state === 'auto_verified') {
              console.log("[Firebase Auth] verified - Auto-verification succeeded!");
              console.log("[Firebase Auth] credential created automatically");
              const credential = PhoneAuthProvider.credential(snapshot.verificationId, snapshot.code);
              
              const userCredential = await signInWithCredential(getAuth(), credential);
              console.log("[Firebase Auth] signInWithCredential success for user:", userCredential.user?.phoneNumber);
              
              await handleBackendPhoneLogin(userCredential.user?.phoneNumber || formattedPhone);
            }
            else if (snapshot.state === 'timeout' || snapshot.state === 'auto_verify_timeout') {
              console.log("[Firebase Auth] timeout - Auto-verification timed out, code must be entered manually");
              toast("Expiró el tiempo de verificación automática. Introduce el código manualmente.", "info");
            }
          }, (error: any) => {
            console.log("[Firebase Auth] error occurred:", error);
            console.error(error);
            toast(`Error de Firebase: ${error.message}`, "error");
            setLoading(false);
          });
      }
    } catch (e: any) {
      console.error("[Firebase Auth] verifyPhoneNumber failed to start:", e);
      toast(`Error al enviar SMS: ${e?.message ?? "Verifica tu configuración de Firebase"}`, "error");
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length < 6) {
      toast("Ingresa el código de 6 dígitos", "error");
      return;
    }

    if (!verificationId) {
      toast("No hay sesión de SMS activa.", "error");
      return;
    }

    setLoading(true);
    try {
      console.log("[Firebase Auth] Manual verification: creating credential...");
      const credential = PhoneAuthProvider.credential(verificationId, otpCode.trim());
      console.log("[Firebase Auth] credential created");

      console.log("[Firebase Auth] Signing in with credential...");
      const userCredential = await signInWithCredential(getAuth(), credential);
      console.log("[Firebase Auth] signInWithCredential success for user:", userCredential.user?.phoneNumber);

      const verifiedPhone = userCredential.user?.phoneNumber;
      if (!verifiedPhone) {
        throw new Error("No se pudo obtener el número verificado de Firebase");
      }

      await handleBackendPhoneLogin(verifiedPhone);
    } catch (e: any) {
      console.error("[Firebase Auth] Verification failed:", e);
      toast(`Código de verificación inválido: ${e?.message}`, "error");
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scroll}
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Header - Imagen completa del logo oficial */}
          <View style={styles.logoHeader}>
            <Image 
              source={require('@/assets/images/ruedalo-logo-clean.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Section - Exact from mockup */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Bienvenido 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              Inicia sesión o crea tu cuenta{"\n"}para solicitar tu próximo viaje.
            </Text>
          </View>

          {/* Tab Selector: Pasajero | Conductor | Empresa - Exact from mockup */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === "passenger" && styles.tabActive]}
              onPress={() => setActiveTab("passenger")}
            >
              <User size={20} color={activeTab === "passenger" ? "#FFFFFF" : colors.textSecondary} strokeWidth={2.5} />
              <Text style={[styles.tabText, activeTab === "passenger" && styles.tabTextActive]}>
                Pasajero
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === "driver" && styles.tabActive]}
              onPress={() => setActiveTab("driver")}
            >
              <SteeringWheelIcon size={20} color={activeTab === "driver" ? "#FFFFFF" : colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === "driver" && styles.tabTextActive]}>
                Conductor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === "company" && styles.tabActive]}
              onPress={() => setActiveTab("company")}
            >
              <BriefcaseIcon size={20} color={activeTab === "company" ? "#FFFFFF" : colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === "company" && styles.tabTextActive]}>
                Empresa
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phone Input - Exact dimensions and layout from mockup */}
          <View style={styles.phoneInputContainer}>
            <View style={styles.phoneInputWrapper}>
              <Phone size={20} color={colors.textMuted} style={styles.phoneIcon} />
              <TextInput
                style={styles.phoneInput}
                placeholder="Número de teléfono"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                testID="login-phone-input"
              />
              <View style={styles.divider} />
              <View style={styles.countryCodeSelector}>
                <Text style={styles.countryCode}>+58</Text>
                <View style={styles.dropdownArrow} />
              </View>
            </View>
          </View>

          {/* Continue Button - Exact from mockup */}
          <TouchableOpacity 
            style={[styles.continueButton, loading && styles.continueButtonLoading]} 
            onPress={onSendOtp}
            disabled={loading}
            testID="send-otp-btn"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continuar</Text>
                <ArrowRight size={20} color="#FFFFFF" style={styles.continueButtonArrow} />
              </>
            )}
          </TouchableOpacity>

          {/* Divider: "o continúa con" - Exact from mockup */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons - Exact dimensions from mockup */}
          <View style={styles.socialButtonsRow}>
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => toast("Google Auth...", "info")}
            >
              <GoogleLogo size={24} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => toast("Apple Auth...", "info")}
            >
              <AppleLogo size={24} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => toast("Facebook Auth...", "info")}
            >
              <FacebookLogo size={24} />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Security Card - Exact from mockup */}
          <View style={styles.securityCard}>
            <View style={styles.securityIconContainer}>
              <Check size={16} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Tu seguridad es nuestra prioridad</Text>
              <Text style={styles.securitySubtitle}>
                Viajes verificados, soporte 24/7{"\n"}y tecnología avanzada.
              </Text>
            </View>
            <ChevronRight size={18} color={colors.primary} style={styles.securityChevron} />
          </View>

          {/* Bottom Links - Exact positioning from mockup */}
          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")} testID="goto-register-btn">
              <Text style={styles.linkText}>
                ¿No tienes cuenta? <Text style={styles.linkHighlight}>Crear cuenta</Text>
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => toast("Canal de ayuda abierto", "info")}>
              <Text style={styles.linkHighlight}>¿Necesitas ayuda?</Text>
            </TouchableOpacity>
          </View>

          {/* Availability Card - Exact from mockup */}
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityHeader}>
              {/* Blue car illustration */}
              <View style={styles.carIllustration}>
                <View style={styles.carRoof} />
                <View style={styles.carBody} />
                <View style={styles.carWindowLeft} />
                <View style={styles.carWindowRight} />
                <View style={styles.carWheelLeft} />
                <View style={styles.carWheelRight} />
              </View>
              <View style={styles.availabilityTextContainer}>
                <Text style={styles.availabilityTitle}>Ruedalo está disponible</Text>
                <Text style={styles.availabilityTitle}>en tu ciudad</Text>
              </View>
            </View>
            <View style={styles.availabilityFeaturesRow}>
              <View style={styles.featureBadge}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Rápido</Text>
              </View>
              <View style={styles.featureBadge}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureText}>Seguro</Text>
              </View>
              <View style={styles.featureBadge}>
                <Check size={14} color={colors.success} strokeWidth={3} />
                <Text style={styles.featureText}>Confiable</Text>
              </View>
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
                  <X size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalShieldBadge}>
                <Shield size={24} color={colors.success} />
                <Text style={styles.modalShieldText}>Código de seguridad enviado</Text>
              </View>

              <Text style={styles.modalDescription}>
                Hemos enviado un código SMS de 6 dígitos a tu número{" "}
                <Text style={styles.modalPhoneHighlight}>+58 {phone}</Text>.
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

              <TouchableOpacity 
                style={styles.modalVerifyButton} 
                onPress={onVerifyOtp} 
                testID="submit-otp-btn"
              >
                <Text style={styles.modalVerifyButtonText}>Verificar código</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 30,
    backgroundColor: "#FFFFFF",
  },

  // Logo Header - Exact from mockup: 50px from top
  logoHeader: {
    marginTop: 50,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  
  logoImage: {
    width: 220,
    height: 62,
  },
  
  logoBrandTextBlock: {
    gap: 0,
  },
  
  logoBrandTitle: {
    fontSize: 32,
    fontFamily: fonts.headingBold,
    color: colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 38,
  },
  
  logoBrandSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.primarySlogan,
    lineHeight: 16,
  },

  // Welcome Section - Exact spacing from mockup
  welcomeSection: {
    marginBottom: 25,
    gap: 10,
  },
  
  welcomeTitle: {
    fontSize: 28,
    fontFamily: fonts.headingBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Tabs - Exact dimensions: ~100px per tab, 8px spacing, 8px border radius
  tabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    backgroundColor: colors.cardLightBlue,
    borderRadius: 8,
    gap: 6,
  },
  
  tabActive: {
    backgroundColor: colors.primary,
  },
  
  tabText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  
  tabTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bodyBold,
  },

  // Phone Input - Exact dimensions: 335px width, 56px height
  phoneInputContainer: {
    marginBottom: 16,
  },
  
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  
  phoneIcon: {
    marginRight: 6,
  },
  
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.textPrimary,
  },
  
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  
  countryCodeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  
  countryCode: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  
  dropdownArrow: {
    width: 6,
    height: 6,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: "45deg" }],
    marginTop: -2,
  },

  // Continue Button - Exact dimensions: 335px width, 56px height
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: 20,
    position: "relative",
  },
  
  continueButtonLoading: {
    opacity: 0.7,
  },
  
  continueButtonText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: "#FFFFFF",
  },
  
  continueButtonArrow: {
    position: "absolute",
    right: 20,
  },

  // Divider Row - Exact from mockup
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  
  dividerText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },

  // Social Buttons - Exact dimensions: ~100px per button, 48px height, 16px spacing
  socialButtonsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  
  socialButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    gap: 4,
  },
  
  socialButtonText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },

  // Security Card - Exact dimensions and colors from mockup
  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardSecurityBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    gap: 12,
  },
  
  securityIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  
  securityTextContainer: {
    flex: 1,
    gap: 2,
  },
  
  securityTitle: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  
  securitySubtitle: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  
  securityChevron: {
    marginLeft: "auto",
  },

  // Links Container - Exact spacing from mockup
  linksContainer: {
    alignItems: "center",
    gap: 16,
    marginBottom: 30,
  },
  
  linkText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  
  linkHighlight: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },

  // Availability Card - Exact from mockup
  availabilityCard: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  
  availabilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  
  // Car Illustration - Blue sedan matching official design EXACTLY
  carIllustration: {
    width: 80,
    height: 50,
    position: "relative",
  },
  
  carRoof: {
    position: "absolute",
    top: 5,
    left: 15,
    width: 50,
    height: 20,
    backgroundColor: "#007BFF",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  
  carBody: {
    position: "absolute",
    bottom: 10,
    left: 0,
    width: 80,
    height: 20,
    backgroundColor: "#007BFF",
    borderRadius: 4,
  },
  
  carWindowLeft: {
    position: "absolute",
    top: 12,
    left: 20,
    width: 16,
    height: 8,
    backgroundColor: "#000000",
    borderTopLeftRadius: 6,
  },
  
  carWindowRight: {
    position: "absolute",
    top: 12,
    right: 23,
    width: 16,
    height: 8,
    backgroundColor: "#000000",
    borderTopRightRadius: 6,
  },
  
  carWheelLeft: {
    position: "absolute",
    bottom: 0,
    left: 18,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#000000",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  
  carWheelRight: {
    position: "absolute",
    bottom: 0,
    right: 18,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#000000",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  
  availabilityTextContainer: {
    flex: 1,
    gap: 2,
  },
  
  availabilityTitle: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  
  availabilityFeaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  
  featureIcon: {
    fontSize: 14,
  },
  
  featureText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },

  // OTP Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: colors.textPrimary,
  },
  
  modalShieldBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginTop: 4,
  },
  
  modalShieldText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.success,
  },
  
  modalDescription: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  
  modalPhoneHighlight: {
    fontFamily: fonts.bodyBold,
  },
  
  otpInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 56,
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 8,
    marginVertical: 10,
  },
  
  modalVerifyButton: {
    backgroundColor: colors.success,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  
  modalVerifyButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: "#FFFFFF",
  },
});
