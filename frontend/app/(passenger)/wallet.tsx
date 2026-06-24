import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Plus, Copy, ArrowUpRight, ArrowDownLeft, X, Building2 } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { NeonButton } from "@/src/components/NeonButton";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";

export default function PassengerWallet() {
  return <WalletScreen />;
}

export function WalletScreen() {
  const { user, refresh } = useAuth();
  const [txns, setTxns] = useState<any[]>([]);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [bank, setBank] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, b, r] = await Promise.all([
        api<any[]>("/wallet/history"),
        api<any>("/wallet/bank-config"),
        api<any[]>("/wallet/my-recharges"),
      ]);
      setTxns(t);
      setBank(b);
      setRecharges(r);
      await refresh();
    } catch {}
  }, [refresh]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitRecharge = async () => {
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) return toast("Monto inválido", "error");
    if (!reference.trim()) return toast("Ingresa la referencia", "error");
    if (!senderPhone.trim()) return toast("Ingresa tu teléfono", "error");
    if (!senderBank.trim()) return toast("Ingresa el banco emisor", "error");
    setSubmitting(true);
    try {
      await api("/wallet/recharge", {
        method: "POST",
        body: { amount_usd: amt, reference: reference.trim(), sender_phone: senderPhone.trim(), sender_bank: senderBank.trim() },
      });
      toast("Recarga enviada, en revisión por admin", "success");
      setOpen(false);
      setAmount(""); setReference(""); setSenderPhone(""); setSenderBank("");
      await load();
    } catch (e: any) {
      toast(e?.message ?? "Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (v: string) => {
    await Clipboard.setStringAsync(v);
    toast("Copiado", "success");
  };

  const all = [
    ...recharges.map((r) => ({
      id: r.id, type: r.status === "approved" ? "recharge" : `recharge_${r.status}`,
      amount: r.amount_usd, description: `Recarga ref ${r.reference}`, created_at: r.created_at, pending: r.status !== "approved",
    })),
    ...txns.map((t) => ({
      id: t.id, type: t.type, amount: t.amount, description: t.description, created_at: t.created_at, pending: false,
    })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>SALDO DISPONIBLE</Text>
        <Text style={styles.balance} testID="wallet-balance">${(user?.wallet_balance ?? 0).toFixed(2)}</Text>
        <Text style={styles.balanceBs}>≈ Bs. {((user?.wallet_balance ?? 0) * (bank?.usd_to_bs_rate ?? 38.5)).toFixed(2)}</Text>
        <TouchableOpacity style={styles.rechargeBtn} onPress={() => setOpen(true)} testID="recharge-btn">
          <Plus size={18} color="#fff" />
          <Text style={styles.rechargeText}>Recargar con Pago Móvil</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Movimientos</Text>
      <FlatList
        data={all}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100, gap: 10 }}
        ListEmptyComponent={<Text style={styles.empty}>Sin movimientos aún.</Text>}
        renderItem={({ item }) => {
          const positive = item.amount > 0;
          const Icon = positive ? ArrowDownLeft : ArrowUpRight;
          const color = item.pending ? colors.warning : positive ? colors.secondary : colors.primary;
          return (
            <View style={styles.txn}>
              <View style={[styles.txnIcon, { borderColor: color }]}>
                <Icon size={16} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.txnDate}>{new Date(item.created_at).toLocaleString("es-VE")}{item.pending ? " · pendiente" : ""}</Text>
              </View>
              <Text style={[styles.txnAmt, { color }]}>{positive ? "+" : ""}${Math.abs(item.amount).toFixed(2)}</Text>
            </View>
          );
        }}
      />

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <KeyboardAwareScrollView contentContainerStyle={styles.modalScroll} bottomOffset={20} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recargar wallet</Text>
              <TouchableOpacity onPress={() => setOpen(false)} testID="close-recharge-btn"><X size={26} color={colors.textPrimary} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Envía un Pago Móvil y reporta la referencia</Text>

            <View style={styles.bankBox}>
              <View style={styles.bankHead}>
                <Building2 size={18} color={colors.secondary} />
                <Text style={styles.bankTitle}>Datos para Pago Móvil</Text>
              </View>
              {bank && (
                <>
                  <BankRow label="Banco" value={bank.bank_name} onCopy={() => copy(bank.bank_name)} />
                  <BankRow label="Cédula" value={bank.cedula} onCopy={() => copy(bank.cedula)} />
                  <BankRow label="Teléfono" value={bank.phone} onCopy={() => copy(bank.phone)} />
                  <BankRow label="Titular" value={bank.holder_name} onCopy={() => copy(bank.holder_name)} />
                  <BankRow label="Tasa BCV" value={`Bs. ${bank.usd_to_bs_rate}/USD`} />
                </>
              )}
            </View>

            <View style={{ gap: 12 }}>
              <FieldInput label="Monto en USD" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="10.00" testID="recharge-amount-input" />
              <FieldInput label="Referencia de Pago Móvil" value={reference} onChangeText={setReference} keyboardType="number-pad" placeholder="123456" testID="pago-movil-ref-input" />
              <FieldInput label="Tu teléfono emisor" value={senderPhone} onChangeText={setSenderPhone} keyboardType="phone-pad" placeholder="0414-1234567" testID="recharge-sender-phone-input" />
              <FieldInput label="Tu banco emisor" value={senderBank} onChangeText={setSenderBank} placeholder="Mercantil" testID="recharge-sender-bank-input" />
              <NeonButton title="Enviar para verificación" onPress={submitRecharge} loading={submitting} testID="pago-movil-submit" />
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function BankRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={styles.bankValue}>{value}</Text>
        {onCopy && <TouchableOpacity onPress={onCopy}><Copy size={14} color={colors.textSecondary} /></TouchableOpacity>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 30 },
  balanceCard: {
    margin: spacing.md, marginTop: 0, padding: spacing.lg, borderRadius: 24,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.secondary,
    gap: 4, ...shadows.neonSecondary,
  },
  balanceLabel: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2 },
  balance: { color: colors.secondary, fontFamily: fonts.headingBold, fontSize: 48, letterSpacing: -1, marginTop: 2 },
  balanceBs: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  rechargeBtn: {
    marginTop: 12, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 999, ...shadows.neonPrimary,
  },
  rechargeText: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },

  sectionTitle: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", paddingHorizontal: spacing.md, marginTop: 6, marginBottom: 6 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 30, fontFamily: fonts.body },
  txn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  txnIcon: { width: 38, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 1, backgroundColor: colors.elevated },
  txnDesc: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 13 },
  txnDate: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  txnAmt: { fontFamily: fonts.headingBold, fontSize: 16 },

  modalScroll: { padding: spacing.md, gap: 16, paddingBottom: 50 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 26 },
  modalSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  bankBox: { backgroundColor: colors.surface, padding: 16, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.secondary, gap: 10 },
  bankHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  bankTitle: { color: colors.secondary, fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1 },
  bankRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  bankLabel: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  bankValue: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 14 },
});
