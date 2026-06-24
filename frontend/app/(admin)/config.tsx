import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { api } from "@/src/lib/api";
import { colors, fonts, spacing } from "@/src/lib/theme";
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

  const load = useCallback(async () => {
    try {
      const b = await api<any>("/wallet/bank-config");
      setBankName(b.bank_name); setCedula(b.cedula); setPhone(b.phone);
      setHolder(b.holder_name); setRate(String(b.usd_to_bs_rate));
    } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: 80, gap: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 30 },
  sub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
});
