import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { toast } from "@/src/components/Toast";

const ROLE_COLOR: Record<string, string> = {
  passenger: colors.secondary,
  driver: colors.primary,
  admin: colors.primaryDim,
};

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try { const u = await api<any[]>("/admin/users"); setUsers(u); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const adjustWallet = async (type: "add" | "deduct") => {
    if (!selectedUser) return;
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      toast("Ingresa un monto válido", "error");
      return;
    }
    setWorking(true);
    try {
      const actualAmt = (type === "add" ? 1 : -1) * amt;
      await api(`/admin/users/${selectedUser.id}/wallet`, {
        method: "POST",
        body: { amount: actualAmt, description: description.trim() || undefined }
      });
      toast(type === "add" ? "Saldo sumado con éxito" : "Saldo restado con éxito", "success");
      setModalOpen(false);
      await load();
    } catch (e: any) {
      toast(e?.message ?? "Error al ajustar saldo", "error");
    } finally {
      setWorking(false);
    }
  };

  const toggleActive = async (userId: string) => {
    try {
      const res = await api<any>(`/admin/users/${userId}/toggle-active`, { method: "POST" });
      toast(res.is_active ? "Usuario activado con éxito" : "Usuario desactivado con éxito", "info");
      await load();
    } catch (e: any) {
      toast(e?.message ?? "Error al cambiar estado del usuario", "error");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
        <Text style={styles.subtitle}>{users.length} registrados</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: spacing.md, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avTxt}>{item.name?.[0]}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <TouchableOpacity 
                  style={[styles.activeBtn, item.is_active !== false ? styles.activeBtnOn : styles.activeBtnOff]}
                  onPress={() => toggleActive(item.id)}
                  testID={`toggle-active-${item.id}`}
                >
                  <Text style={[styles.activeBtnTxt, item.is_active !== false ? styles.activeBtnTxtOn : styles.activeBtnTxtOff]}>
                    {item.is_active !== false ? "Activo" : "Bloqueado"}
                  </Text>
                </TouchableOpacity>
                <View style={[styles.badge, { borderColor: ROLE_COLOR[item.role] }]}>
                  <Text style={[styles.badgeTxt, { color: ROLE_COLOR[item.role] }]}>{item.role.toUpperCase()}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.balContainer} 
                onPress={() => {
                  setSelectedUser(item);
                  setAmount("");
                  setDescription("");
                  setModalOpen(true);
                }}
                testID={`adjust-balance-${item.id}`}
              >
                <Text style={styles.bal}>${(item.wallet_balance ?? 0).toFixed(2)}</Text>
                <Text style={styles.balLabel}>Ajustar</Text>
              </TouchableOpacity>
              {item.role === "driver" && (
                <Text style={[styles.onlineDot, { color: item.is_online ? colors.secondary : colors.textMuted }]}>
                  {item.is_online ? "● En línea" : "○ Offline"}
                </Text>
              )}
            </View>
          </View>
        )}
      />

      {/* Adjust Wallet Balance Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajustar Billetera</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.userSummary}>
                <Text style={styles.userSummaryName}>{selectedUser.name}</Text>
                <Text style={styles.userSummaryBal}>
                  Saldo Actual: <Text style={{ fontFamily: fonts.headingBold, color: colors.secondary }}>${(selectedUser.wallet_balance ?? 0).toFixed(2)}</Text>
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto en USD</Text>
              <TextInput
                style={styles.input}
                placeholder="10.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                testID="admin-adjust-amount-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción / Motivo (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Bono de compensación, corrección de saldo, etc."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                testID="admin-adjust-desc-input"
              />
            </View>

            {working ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: colors.danger }]} 
                  onPress={() => adjustWallet("deduct")}
                  testID="admin-deduct-balance-btn"
                >
                  <Text style={styles.modalBtnTxt}>Restar Saldo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: colors.success || "#10B981" }]} 
                  onPress={() => adjustWallet("add")}
                  testID="admin-add-balance-btn"
                >
                  <Text style={styles.modalBtnTxt}>Sumar Saldo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 30 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18 },
  name: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  email: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  phone: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  badgeTxt: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.5 },
  bal: { color: colors.secondary, fontFamily: fonts.bodyBold, fontSize: 14, textAlign: "right" },
  balContainer: { alignItems: "flex-end", backgroundColor: colors.elevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: colors.border },
  balLabel: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 9, marginTop: 1 },
  onlineDot: { fontFamily: fonts.body, fontSize: 10, marginTop: 4 },

  activeBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  activeBtnOn: { borderColor: colors.success || "#10B981", backgroundColor: "#ECFDF5" },
  activeBtnOff: { borderColor: colors.danger, backgroundColor: "#FEF2F2" },
  activeBtnTxt: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.5 },
  activeBtnTxtOn: { color: colors.success || "#10B981" },
  activeBtnTxtOff: { color: colors.danger },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface, borderRadius: 24, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 14, ...shadows.card },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 20 },
  userSummary: { backgroundColor: colors.elevated, padding: 12, borderRadius: radii.md, gap: 2 },
  userSummaryName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13 },
  userSummaryBal: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  inputGroup: { gap: 6 },
  label: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 12 },
  input: { backgroundColor: colors.elevated, color: colors.textPrimary, fontFamily: fonts.body, fontSize: 14, height: 48, borderRadius: radii.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  modalBtn: { flex: 1, height: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", ...shadows.btn },
  modalBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 13 },
});
