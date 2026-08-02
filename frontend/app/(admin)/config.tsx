import { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Trash2 } from "lucide-react-native";

import { api } from "@/src/lib/api";
import { colors, fonts, spacing, radii, shadows } from "@/src/lib/theme";
import { FieldInput } from "@/src/components/FieldInput";
import { NeonButton } from "@/src/components/NeonButton";
import { toast } from "@/src/components/Toast";

export default function AdminConfig() {
  const [bankName, setBankName] = useState("");
  const [cedula, setCedula] = useState("");
  const [phone, setPhone] = useState("");
  const [holder, setHolder] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);

  // Promo Code States
  const [promos, setPromos] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoRecharge, setPromoRecharge] = useState("");
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Push Notification States
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushTarget, setPushTarget] = useState<"all" | "drivers" | "passengers" | "individual">("all");
  const [pushUserId, setPushUserId] = useState("");
  const [sendingPush, setSendingPush] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([
        api<any>("/wallet/bank-config"),
        api<any[]>("/admin/promocodes"),
      ]);
      setBankName(b.bank_name); setCedula(b.cedula); setPhone(b.phone);
      setHolder(b.holder_name); setRate(String(b.usd_to_bs_rate));
      setPromos(p);
    } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sendPush = async () => {
    if (!pushTitle.trim() || !pushBody.trim()) {
      return toast("Ingresa el título y mensaje de la notificación", "error");
    }
    if (pushTarget === "individual" && !pushUserId.trim()) {
      return toast("Ingresa el ID del usuario objetivo", "error");
    }
    setSendingPush(true);
    try {
      await api("/admin/push", {
        method: "POST",
        body: {
          title: pushTitle.trim(),
          body: pushBody.trim(),
          target: pushTarget,
          user_id: pushTarget === "individual" ? pushUserId.trim() : undefined,
        }
      });
      toast("Notificación push masiva enviada con éxito", "success");
      setPushTitle(""); setPushBody(""); setPushUserId("");
    } catch (e: any) {
      toast(e?.message ?? "Error al enviar notificación", "error");
    } finally {
      setSendingPush(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api("/admin/bank-config", { method: "PUT", body: {
        bank_name: bankName, cedula, phone, holder_name: holder, usd_to_bs_rate: parseFloat(rate) || 0,
      } });
      toast("Configuración guardada", "success");
    } catch (e: any) { toast(e?.message ?? "Error", "error"); }
    finally { setSaving(false); }
  };

  const createPromo = async () => {
    if (!promoCode.trim()) return toast("Ingresa un código", "error");
    setCreatingPromo(true);
    try {
      await api("/admin/promocodes", {
        method: "POST",
        body: {
          code: promoCode.trim(),
          discount_usd: parseFloat(promoDiscount) || 0.0,
          recharge_amount_usd: parseFloat(promoRecharge) || 0.0,
        }
      });
      toast("Código de promoción creado", "success");
      setPromoCode(""); setPromoDiscount(""); setPromoRecharge("");
      const p = await api<any[]>("/admin/promocodes");
      setPromos(p);
    } catch (e: any) {
      toast(e?.message ?? "Error al crear código", "error");
    } finally {
      setCreatingPromo(false);
    }
  };

  const deletePromo = async (code: string) => {
    try {
      await api(`/admin/promocodes/${code}`, { method: "DELETE" });
      toast("Código eliminado", "info");
      const p = await api<any[]>("/admin/promocodes");
      setPromos(p);
    } catch (e: any) {
      toast(e?.message ?? "Error al eliminar código", "error");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} bottomOffset={20} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.sub}>Datos de Pago Móvil que verán los usuarios</Text>
        <View style={{ gap: 12, marginTop: 16 }}>
          <FieldInput label="Banco receptor" value={bankName} onChangeText={setBankName} placeholder="Banco de Venezuela" testID="config-bank-input" />
          <FieldInput label="Cédula del titular" value={cedula} onChangeText={setCedula} placeholder="V-12345678" testID="config-cedula-input" />
          <FieldInput label="Teléfono asociado" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0414-1234567" testID="config-phone-input" />
          <FieldInput label="Nombre del titular" value={holder} onChangeText={setHolder} placeholder="RideVE C.A." testID="config-holder-input" />
          <FieldInput label="Tasa BCV (Bs por USD)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="38.5" testID="config-rate-input" />
          <NeonButton title="Guardar cambios" onPress={save} loading={saving} testID="config-save-btn" />
        </View>

        {/* PROMO CODES SECTION */}
        <Text style={styles.sectionTitle}>Códigos de Promoción</Text>
        <Text style={styles.sectionSub}>Crea códigos promocionales que recargan wallet o dan descuento</Text>
        
        <View style={styles.promoForm}>
          <FieldInput label="Código (Ej: RUEDALO2026)" value={promoCode} onChangeText={setPromoCode} placeholder="RUEDALO50" autoCapitalize="characters" testID="promo-code-input" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FieldInput label="Descuento (USD)" value={promoDiscount} onChangeText={setPromoDiscount} keyboardType="decimal-pad" placeholder="1.50" testID="promo-discount-input" />
            </View>
            <View style={{ flex: 1 }}>
              <FieldInput label="Suma a Wallet (USD)" value={promoRecharge} onChangeText={setPromoRecharge} keyboardType="decimal-pad" placeholder="5.00" testID="promo-recharge-input" />
            </View>
          </View>
          <NeonButton title="Crear Código Promocional" onPress={createPromo} loading={creatingPromo} variant="secondary" testID="promo-create-btn" />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Códigos Activos ({promos.length})</Text>
        {promos.length === 0 ? (
          <Text style={styles.emptyText}>No hay códigos promocionales creados.</Text>
        ) : (
          <View style={styles.promoList}>
            {promos.map((p) => (
              <View key={p.code} style={styles.promoCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoCodeText}>{p.code}</Text>
                  <Text style={styles.promoDetailText}>
                    Descuento: ${p.discount_usd.toFixed(2)} · Suma Wallet: +${p.recharge_amount_usd.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deletePromo(p.code)} style={styles.deletePromoBtn} testID={`delete-promo-${p.code}`}>
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* PUSH NOTIFICATIONS SECTION */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Notificaciones Push Masivas</Text>
        <Text style={styles.sectionSub}>Envía avisos de difusión a todos los conductores o pasajeros de inmediato</Text>

        <View style={styles.promoForm}>
          <FieldInput label="Título de la Notificación" value={pushTitle} onChangeText={setPushTitle} placeholder="¡Atención Conductores!" testID="push-title-input" />
          <FieldInput label="Mensaje / Mensaje Masivo" value={pushBody} onChangeText={setPushBody} placeholder="Hay alta demanda en Plaza Altamira hoy..." multiline testID="push-body-input" />
          
          <Text style={styles.targetLabel}>Segmento Objetivo</Text>
          <View style={styles.targetRow}>
            {["all", "drivers", "passengers", "individual"].map((t) => {
              const label = t === "all" ? "Todos" : t === "drivers" ? "Conductores" : t === "passengers" ? "Pasajeros" : "Individual";
              const active = pushTarget === t;
              return (
                <TouchableOpacity 
                  key={t} 
                  onPress={() => setPushTarget(t as any)} 
                  style={[styles.targetChip, active && styles.targetChipActive]}
                  testID={`push-target-${t}`}
                >
                  <Text style={[styles.targetChipTxt, active && styles.targetChipTxtActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {pushTarget === "individual" && (
            <FieldInput label="ID único de usuario objetivo" value={pushUserId} onChangeText={setPushUserId} placeholder="usuario-uuid-1234" testID="push-userid-input" />
          )}

          <NeonButton title="Enviar Notificación de Difusión" onPress={sendPush} loading={sendingPush} testID="push-submit-btn" />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: 80, gap: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 30 },
  sub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  
  // Promo Codes styling
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18, marginTop: 32, marginBottom: 2 },
  sectionSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginBottom: 14 },
  promoForm: { backgroundColor: colors.surface, padding: 16, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, gap: 8, ...shadows.card },
  emptyText: { color: colors.textMuted, textAlign: "center", marginVertical: 20, fontFamily: fonts.body, fontSize: 12 },
  promoList: { gap: 8, marginTop: 8 },
  promoCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  promoCodeText: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 13 },
  promoDetailText: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 1 },
  deletePromoBtn: { width: 34, height: 34, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  targetLabel: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 11, marginTop: 4 },
  targetRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginVertical: 4 },
  targetChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.elevated },
  targetChipActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
  targetChipTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 11 },
  targetChipTxtActive: { color: "#fff", fontFamily: fonts.bodyBold },
});
