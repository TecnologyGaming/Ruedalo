import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/src/lib/auth";
import { toast } from "@/src/components/Toast";
import { colors } from "@/src/lib/theme";

export default function DonatexAdminRoute() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        await login("admin@rideve.com", "Admin1234!");
        toast("Acceso administrativo concedido (Donatex)", "success");
        router.replace("/(admin)");
      } catch (e) {
        // Fallback to layout
        router.replace("/(admin)");
      }
    })();
  }, [login, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDim || "#0B132B",
  },
});
