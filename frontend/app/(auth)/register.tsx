import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { NeonButton } from "@/src/components/NeonButton";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";
import { ArrowLeft, User, Car, UploadCloud, CheckCircle2, Lock, Mail, Phone, BookOpen } from "lucide-react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [cedula, setCedula] = useState("");
  const [cedulaPhoto, setCedulaPhoto] = useState<string | null>(null);
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const simulateDocUpload = () => {
    setUploadingDoc(true);
    setTimeout(() => {
      setUploadingDoc(false);
      setCedulaPhoto("base64_simulated_cedula_image_data");
      toast("Documento de identidad (Cédula) cargado con éxito", "success");
    }, 1500);
  };

  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !cedula.trim()) {
      toast("Completa todos los campos, incluyendo la Cédula", "error");
      return;
    }
    if (password.length < 6) {
      toast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    if (!cedulaPhoto) {
      toast("Por favor, sube la foto de tu Cédula para verificación", "error");
      return;
    }
    try {
      setLoading(true);
      const u = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        cedula: cedula.trim(),
        cedula_photo: cedulaPhoto
      } as any);
      toast(`Cuenta creada con éxito. ¡Bienvenido ${u.name}!`, "success");
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
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Text style={styles.title}>Crear tu cuenta</Text>
          <Text style={styles.subtitle}>Regístrate en la plataforma y viaja con total confianza</Text>
        </View>

        <View style={styles.roleContainer}>
          <Text style={styles.sectionTitle}>¿Cómo vas a usar la app?</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === "passenger" && styles.roleCardActiveP]}
              onPress={() => setRole("passenger")}
              testID="role-passenger-btn"
            >
              <User size={24} color={role === "passenger" ? colors.primary : colors.textSecondary} />
              <Text style={[styles.roleText, role === "passenger" && { color: colors.primary }]}>Pasajero</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleCard, role === "driver" && styles.roleCardActiveS]}
              onPress={() => setRole("driver")}
              testID="role-driver-btn"
            >
              <Car size={24} color={role === "driver" ? colors.secondary : colors.textSecondary} />
              <Text style={[styles.roleText, role === "driver" && { color: colors.secondary }]}>Conductor</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          
          <FieldInput 
            label="Nombre completo" 
            value={name} 
            onChangeText={setName} 
            placeholder="Ej. Luis Pérez" 
            leftIcon={<User size={18} color={colors.textSecondary} />}
            testID="register-name-input" 
          />
          <FieldInput 
            label="Correo electrónico" 
            value={email} 
            onChangeText={setEmail} 
            placeholder="correo@ejemplo.com" 
            autoCapitalize="none" 
            keyboardType="email-address" 
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
            testID="register-email-input" 
          />
          <FieldInput 
            label="Número de teléfono" 
            value={phone} 
            onChangeText={setPhone} 
            placeholder="0414 1234567" 
            keyboardType="phone-pad" 
            leftIcon={<Phone size={18} color={colors.textSecondary} />}
            testID="register-phone-input" 
          />
          <FieldInput 
            label="Contraseña" 
            value={password} 
            onChangeText={setPassword} 
            placeholder="Mínimo 6 caracteres" 
            secureTextEntry 
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            testID="register-password-input" 
          />

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Verificación de Identidad (Obligatorio)</Text>
          <Text style={styles.sectionDesc}>De acuerdo con las normativas en Venezuela, requerimos tu Cédula de Identidad para activar tu cuenta.</Text>

          <FieldInput 
            label="Cédula de Identidad" 
            value={cedula} 
            onChangeText={setCedula} 
            placeholder="Ej. V-12345678" 
            leftIcon={<BookOpen size={18} color={colors.textSecondary} />}
            testID="register-cedula-input" 
          />

          <View style={styles.uploadContainer}>
            <Text style={styles.uploadLabel}>Foto de tu Cédula de Identidad</Text>
            <Text style={styles.uploadSub}>Sube una foto legible donde se aprecien tus datos.</Text>
            
            {uploadingDoc ? (
              <View style={styles.uploadButtonPlaceholder}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.uploadButtonTxt}>Procesando imagen...</Text>
              </View>
            ) : cedulaPhoto ? (
              <View style={styles.uploadedSuccessBox}>
                <CheckCircle2 size={24} color={colors.success} />
                <Text style={styles.uploadedSuccessTxt}>Cédula cargada con éxito</Text>
                <TouchableOpacity style={styles.reUploadBtn} onPress={simulateDocUpload}>
                  <Text style={styles.reUploadBtnTxt}>Cambiar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={simulateDocUpload} testID="upload-cedula-btn">
                <UploadCloud size={24} color={colors.textSecondary} />
                <Text style={styles.uploadButtonTxt}>Subir archivo o tomar foto</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.8 }]} 
            onPress={onSubmit} 
            disabled={loading || uploadingDoc} 
            testID="register-submit-btn"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnTxt}>Crear cuenta segura</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  back: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadows.card },
  header: { marginTop: 10, gap: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 28, letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  roleContainer: { gap: 10, marginTop: 12 },
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 16 },
  sectionDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  roleRow: { flexDirection: "row", gap: 12 },
  roleCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 16, alignItems: "center", gap: 8, ...shadows.card },
  roleCardActiveP: { borderColor: colors.primary, backgroundColor: "#FFF1F2" },
  roleCardActiveS: { borderColor: colors.secondary, backgroundColor: "#ECFDF5" },
  roleText: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 14 },
  form: { gap: 12, marginTop: 12, paddingBottom: 40 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  uploadContainer: { gap: 6, marginVertical: 8 },
  uploadLabel: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13 },
  uploadSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginBottom: 6 },
  uploadButton: { height: 80, borderStyle: "dashed", borderWidth: 1.5, borderColor: colors.textMuted, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: 8 },
  uploadButtonPlaceholder: { height: 80, borderStyle: "dashed", borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: 8 },
  uploadButtonTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 13 },
  uploadedSuccessBox: { height: 80, borderWidth: 1.5, borderColor: colors.success, borderRadius: radii.md, backgroundColor: "#F0FDF4", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 },
  uploadedSuccessTxt: { flex: 1, color: colors.success, fontFamily: fonts.bodyBold, fontSize: 13 },
  reUploadBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full },
  reUploadBtnTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 11 },
  submitBtn: { backgroundColor: colors.primary, height: 54, borderRadius: radii.xl, alignItems: "center", justifyContent: "center", marginTop: 12, ...shadows.neonPrimary },
  submitBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 16 },
});
