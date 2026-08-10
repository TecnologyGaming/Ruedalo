import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, User, Mail, Phone, Car, BookOpen, ShieldCheck, HelpCircle, SwitchCamera, ArrowRight, X, Check, FileText, Settings, MapPin, Sparkles } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { NeonButton } from "@/src/components/NeonButton";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";

export default function PassengerProfile() {
  return <ProfileScreen />;
}

export function ProfileScreen() {
  const { user, logout, setUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Driver registration modal
  const [driverModal, setDriverModal] = useState(false);
  const [vehicleType, setVehicleType] = useState<"automobile" | "moto">("automobile");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [plate, setPlate] = useState("");
  const [passengerCapacity, setPassengerCapacity] = useState("4");
  const [category, setCategory] = useState<"moto" | "economico" | "confort" | "xl">("economico");
  const [registering, setRegistering] = useState(false);

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  // Switch role dynamically
  const toggleRole = async () => {
    // If they have driver status approved, let them switch
    if (user?.role === "driver" || user?.driver_status === "approved") {
      setLoading(true);
      try {
        const u = await api<any>("/users/switch_role", { method: "POST" });
        setUser(u);
        toast(`Cambiando a Modo ${u.role === "driver" ? "Conductor" : "Pasajero"}`, "success");
        if (u.role === "driver") {
          router.replace("/(driver)");
        } else {
          router.replace("/(passenger)");
        }
      } catch (e: any) {
        toast(e?.message ?? "Error al cambiar de modo", "error");
      } finally {
        setLoading(false);
      }
    } else if (user?.driver_status === "pending") {
      toast("Tu solicitud de conductor está pendiente de aprobación por el Administrador.", "info");
    } else {
      // Prompt driver registration modal
      setDriverModal(true);
    }
  };

  const registerAsDriver = async () => {
    if (!vehicleModel.trim() || !vehicleYear.trim() || !plate.trim() || !vehicleBrand.trim()) {
      toast("Completa todos los datos del vehículo", "error");
      return;
    }
    setRegistering(true);
    try {
      const u = await api<any>("/users/register_driver", {
        method: "POST",
        body: {
          vehicle_type: vehicleType,
          vehicle_brand: vehicleBrand.trim(),
          vehicle_model: vehicleModel.trim(),
          vehicle_year: vehicleYear.trim(),
          plate: plate.trim(),
          passenger_capacity: parseInt(passengerCapacity) || 1,
          category: category
        }
      });
      setUser(u);
      setDriverModal(false);
      toast("Solicitud de Conductor enviada correctamente.", "success");
    } catch (e: any) {
      toast(e?.message ?? "Error al enviar solicitud", "error");
    } finally {
      setRegistering(false);
    }
  };

  // Quick simulator button for developers/users to auto-approve themselves
  const simulateAdminApproval = async () => {
    setLoading(true);
    try {
      // Call admin endpoints using credentials or direct simulation
      await api(`/admin/drivers/${user?.id}/approve`, { method: "POST" });
      const u = await api<any>("/auth/me");
      setUser(u);
      toast("¡Aprobación simulada con éxito! Ya puedes cambiar a Modo Conductor.", "success");
    } catch (e) {
      // fallback in case admin role requirement hits (if testing with passenger token)
      // We can simulate updating role directly to driver for testing
      setUser({ ...user, driver_status: "approved" } as any);
      toast("Estatus de conductor aprobado localmente.", "success");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* User Badge Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{user?.name?.[0] ?? "U"}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phoneTxt}>{user?.phone}</Text>
          
          <View style={[styles.roleBadge, user?.is_verified && { borderColor: colors.secondary, backgroundColor: "#ECFDF5" }]}>
            {user?.is_verified ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={14} color={colors.secondary} />
                <Text style={[styles.roleText, { color: colors.secondary }]}>Usuario Verificado</Text>
              </View>
            ) : (
              <Text style={styles.roleText}>No Verificado</Text>
            )}
          </View>
        </View>

        {/* Horizontal Action Row (Yango Style) */}
        <View style={styles.yangoActionRow}>
          <TouchableOpacity style={styles.yangoActionBtn} onPress={() => router.push("/(passenger)/trips")}>
            <View style={styles.yangoActionIconBox}>
              <FileText size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.yangoActionLabel}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.yangoActionBtn} onPress={() => toast("Conectando con el canal de soporte 24/7...", "info")}>
            <View style={styles.yangoActionIconBox}>
              <HelpCircle size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.yangoActionLabel}>Soporte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.yangoActionBtn} onPress={() => toast("Función de Direcciones Guardadas próximamente", "info")}>
            <View style={styles.yangoActionIconBox}>
              <MapPin size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.yangoActionLabel}>Direcciones</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.yangoActionBtn} onPress={() => toast("Abriendo configuración avanzada...", "info")}>
            <View style={styles.yangoActionIconBox}>
              <Settings size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.yangoActionLabel}>Ajustes</Text>
          </TouchableOpacity>
        </View>

        {/* Unified Mode Switcher Component - Ridery inspired */}
        <View style={styles.modeContainer}>
          <Text style={styles.modeSectionTitle}>Socio Conductor</Text>
          <Text style={styles.modeDesc}>Genera ingresos adicionales manejando tu carro o moto en Venezuela.</Text>
          
          {user?.driver_status === "approved" ? (
            <TouchableOpacity style={styles.switchModeBtn} onPress={toggleRole} disabled={loading}>
              <SwitchCamera size={18} color="#fff" />
              <Text style={styles.switchModeBtnTxt}>
                {loading ? "Cambiando..." : user.role === "passenger" ? "Ir al Panel de Conductor" : "Ir al Panel de Pasajero"}
              </Text>
              <ArrowRight size={16} color="#fff" />
            </TouchableOpacity>
          ) : user?.driver_status === "pending" ? (
            <View style={styles.pendingStatusBox}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingTxt}>Solicitud pendiente de aprobación de documentos</Text>
              
              {/* Quick simulation helper for demonstration */}
              <TouchableOpacity style={styles.simAppBtn} onPress={simulateAdminApproval} disabled={loading}>
                <Text style={styles.simAppBtnTxt}>Simular Aprobación del Administrador</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.registerDriverBtn} onPress={toggleRole}>
              <Car size={18} color={colors.primary} />
              <Text style={styles.registerDriverBtnTxt}>Quiero ser conductor</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile details list */}
        <Text style={[styles.modeSectionTitle, { marginLeft: spacing.md, marginTop: 10 }]}>Información de Cuenta</Text>
        <View style={styles.card}>
          <Row icon={<Mail size={16} color={colors.primary} />} label="Correo Electrónico" value={user?.email ?? ""} />
          <Row icon={<BookOpen size={16} color={colors.primary} />} label="Cédula de Identidad" value={user?.cedula ?? "No registrada"} />
          <Row icon={<Phone size={16} color={colors.primary} />} label="Teléfono de Contacto" value={user?.phone ?? ""} />
          <Row icon={<Sparkles size={16} color={colors.primary} />} label="Mi Código de Referido" value={user?.referral_code ?? ""} />
          {user?.driver_status === "approved" && (
            <>
              <Row icon={<Car size={16} color={colors.secondary} />} label="Vehículo Registrado" value={`${user?.vehicle_model} (${user?.vehicle_year})`} />
              <Row icon={<FileText size={16} color={colors.secondary} />} label="Placa" value={user?.plate ?? ""} />
            </>
          )}
        </View>

        {/* Share Referral Code Section (Yango inspired) */}
        <View style={styles.shareReferralContainer}>
          <Text style={styles.shareTitle}>Invita amigos y gana saldo 🎁</Text>
          <Text style={styles.shareDesc}>Comparte tu código único y recibe +$2.50 USD de regalo cuando tu referido complete su primer viaje.</Text>
          <TouchableOpacity 
            style={styles.shareBtn} 
            onPress={() => {
              toast(`Código copiado: ${user?.referral_code}`, "success");
            }}
          >
            <Text style={styles.shareBtnTxt}>Copiar mi código: {user?.referral_code}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <LogOut size={18} color={colors.danger} />
            <Text style={styles.logoutBtnTxt}>Cerrar Sesión Segura</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Driver Registration Modal */}
      <Modal visible={driverModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Car size={24} color={colors.primary} />
                <Text style={styles.modalTitle}>Registro de Conductor</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDriverModal(false)}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubtitle}>Socio de Conducción en Venezuela</Text>
              <Text style={styles.modalDesc}>Por favor, ingresa los datos de tu vehículo (carro o moto) para enviar tu postulación de socio conductor.</Text>

              {/* TIPO DE VEHÍCULO SELECTION */}
              <Text style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 4 }}>Tipo de Vehículo</Text>
              <div style={{ flexDirection: "row", gap: 10, marginBottom: 4, display: "flex" }}>
                <TouchableOpacity 
                  onPress={() => { setVehicleType("automobile"); setCategory("economico"); setPassengerCapacity("4"); }}
                  style={{ flex: 1, height: 42, borderRadius: radii.md, backgroundColor: vehicleType === "automobile" ? colors.primary : colors.elevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ color: vehicleType === "automobile" ? "#fff" : colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13 }}>🚗 Automóvil</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { setVehicleType("moto"); setCategory("moto"); setPassengerCapacity("1"); }}
                  style={{ flex: 1, height: 42, borderRadius: radii.md, backgroundColor: vehicleType === "moto" ? colors.primary : colors.elevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ color: vehicleType === "moto" ? "#fff" : colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13 }}>🏍️ Moto</Text>
                </TouchableOpacity>
              </div>

              <FieldInput 
                label="Marca del Vehículo" 
                value={vehicleBrand} 
                onChangeText={setVehicleBrand} 
                placeholder="Ej: Toyota / Suzuki" 
                testID="vehicle-brand-input"
              />

              <FieldInput 
                label="Modelo del Vehículo" 
                value={vehicleModel} 
                onChangeText={setVehicleModel} 
                placeholder="Ej: Corolla / V-Strom" 
                testID="vehicle-model-input"
              />
              
              <FieldInput 
                label="Año del Vehículo" 
                value={vehicleYear} 
                onChangeText={setVehicleYear} 
                placeholder="Ej: 2018" 
                keyboardType="number-pad" 
                testID="vehicle-year-input"
              />

              <FieldInput 
                label="Placa / Patente" 
                value={plate} 
                onChangeText={setPlate} 
                placeholder="Ej: AD123BD" 
                autoCapitalize="characters"
                testID="vehicle-plate-input"
              />

              {vehicleType === "automobile" ? (
                <>
                  <FieldInput 
                    label="Capacidad de pasajeros" 
                    value={passengerCapacity} 
                    onChangeText={setPassengerCapacity} 
                    placeholder="Ej: 4" 
                    keyboardType="number-pad" 
                    testID="vehicle-capacity-input"
                  />

                  {/* CATEGORY SELECTOR FOR CARS */}
                  <Text style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 4 }}>Categoría de Servicio</Text>
                  <div style={{ flexDirection: "row", gap: 8, marginBottom: 4, display: "flex" }}>
                    {(["economico", "confort", "xl"] as const).map((cat) => (
                      <TouchableOpacity 
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={{ flex: 1, height: 38, borderRadius: radii.sm, backgroundColor: category === cat ? colors.secondary : colors.elevated, alignItems: "center", justifyContent: "center" }}
                      >
                        <Text style={{ color: category === cat ? "#fff" : colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: "capitalize" }}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </div>
                </>
              ) : null}

              <View style={styles.termsBox}>
                <Check size={14} color={colors.secondary} />
                <Text style={styles.termsTxt}>Acepto cumplir con los estándares de seguridad y tarifas oficiales.</Text>
              </View>

              <TouchableOpacity 
                style={[styles.submitRegBtn, registering && { opacity: 0.8 }]} 
                onPress={registerAsDriver}
                disabled={registering}
              >
                {registering ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitRegBtnTxt}>Enviar solicitud de socio</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

const ChevronRight = ({ size, color }: { size: number; color: string }) => {
  return (
    <View style={{ marginLeft: "auto" }}>
      <ArrowRight size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: { alignItems: "center", padding: spacing.lg, gap: 6, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 80, height: 80, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadows.neonPrimary },
  avatarTxt: { color: "#fff", fontFamily: fonts.headingBold, fontSize: 32 },
  name: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 20, marginTop: 4 },
  phoneTxt: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  roleBadge: { backgroundColor: colors.elevated, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  roleText: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.5 },
  
  // Switch Mode Box
  modeContainer: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, borderStyle: "solid", borderWidth: 1, borderColor: colors.border, gap: 10, ...shadows.card },
  modeSectionTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 15 },
  modeDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  registerDriverBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FEF2F4", borderWidth: 1, borderColor: "#FEE2E2", height: 48, borderRadius: radii.md, paddingHorizontal: 14, marginTop: 6 },
  registerDriverBtnTxt: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 13 },
  switchModeBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.primary, height: 48, borderRadius: radii.md, paddingHorizontal: 14, marginTop: 6, ...shadows.neonPrimary },
  switchModeBtnTxt: { flex: 1, color: "#fff", fontFamily: fonts.bodyBold, fontSize: 13 },
  
  pendingStatusBox: { backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", borderRadius: radii.md, padding: 12, gap: 8, marginTop: 6 },
  pendingDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.warning, position: "absolute", top: 12, left: 12 },
  pendingTxt: { color: "#92400E", fontFamily: fonts.bodyBold, fontSize: 12, paddingLeft: 12 },
  simAppBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: "#FDE68A", paddingVertical: 6, paddingHorizontal: 10, borderRadius: radii.full, alignSelf: "flex-start", marginTop: 4 },
  simAppBtnTxt: { color: "#92400E", fontFamily: fonts.bodyBold, fontSize: 10 },

  // Yango Profile Action Row
  yangoActionRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surface, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  yangoActionBtn: { flex: 1, alignItems: "center", gap: 6 },
  yangoActionIconBox: { width: 44, height: 44, borderRadius: radii.full, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.border, ...shadows.card },
  yangoActionLabel: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 11, textAlign: "center" },

  // Referral Card
  shareReferralContainer: { margin: spacing.md, backgroundColor: "#ECFDF5", borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: "#A7F3D0", gap: 8, ...shadows.card },
  shareTitle: { color: "#047857", fontFamily: fonts.headingBold, fontSize: 14 },
  shareDesc: { color: "#065F46", fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  shareBtn: { backgroundColor: "#059669", height: 40, borderRadius: radii.md, alignItems: "center", justifyContent: "center", marginTop: 4 },
  shareBtnTxt: { color: "#FFFFFF", fontFamily: fonts.bodyBold, fontSize: 12 },

  card: { marginHorizontal: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 14, ...shadows.card },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  rowIcon: { width: 34, height: 34, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  rowLabel: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  rowValue: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 1 },
  
  actions: { padding: spacing.md, marginTop: 14 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 48, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.danger, backgroundColor: "#FEF2F2" },
  logoutBtnTxt: { color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 14 },

  // Driver modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 14 },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 16 },
  closeBtn: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  modalScroll: { gap: 14, paddingVertical: 14 },
  modalSubtitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 14 },
  modalDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  termsBox: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 4 },
  termsTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 11 },
  submitRegBtn: { backgroundColor: colors.secondary, height: 48, borderRadius: radii.md, alignItems: "center", justifyContent: "center", ...shadows.neonSecondary, marginTop: 10, marginBottom: 20 },
  submitRegBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 14 },
});
