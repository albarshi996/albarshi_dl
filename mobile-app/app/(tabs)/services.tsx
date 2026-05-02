import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LangContext";

const SERVICES = [
  { id: "spareparts", icon: "settings",  color: "#f59e0b", bg: "#1c1600", features: ["ar","en"].map(()=>["","",""])},
  { id: "realestate", icon: "home",      color: "#10b981", bg: "#001612" },
  { id: "wholesale",  icon: "package",   color: "#4f46e5", bg: "#08071f" },
  { id: "documents",  icon: "file-text", color: "#06b6d4", bg: "#001318" },
  { id: "nadworlek",  icon: "search",    color: "#ec4899", bg: "#1a0010" },
  { id: "beauty",     icon: "heart",     color: "#f43f5e", bg: "#1a0008" },
];

export default function ServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
        {t.servicesTitle}
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {t.servicesSubtitle}
      </Text>

      {SERVICES.map((s, i) => {
        const catKey = `cat${s.id.charAt(0).toUpperCase() + s.id.slice(1)}` as keyof typeof t;
        const subKey = `cat${s.id.charAt(0).toUpperCase() + s.id.slice(1)}Sub` as keyof typeof t;
        return (
          <Animated.View key={s.id} entering={FadeInDown.delay(i * 70).springify()}>
            <Pressable
              style={[styles.card, { backgroundColor: s.bg, borderColor: s.color + "30" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/(tabs)/request", params: { category: t[catKey] as string } });
              }}
              testID={`service-${s.id}`}
            >
              <View style={[styles.iconWrap, { backgroundColor: s.color + "20" }]}>
                <Feather name={s.icon as any} size={28} color={s.color} />
              </View>
              <View style={[styles.info, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {t[catKey] as string}
                </Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  {t[subKey] as string}
                </Text>
              </View>
              <Feather
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12,
  },
  iconWrap: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 12 },
});
