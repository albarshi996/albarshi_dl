import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LangContext";
import { WA_PHONE } from "@/constants/i18n";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2;

type ServiceId = "spareparts" | "realestate" | "wholesale" | "documents" | "nadworlek" | "beauty";

interface Service {
  id: ServiceId;
  icon: string;
  color: string;
  bg: string;
}

const SERVICES: Service[] = [
  { id: "spareparts", icon: "settings",    color: "#f59e0b", bg: "#1c1600" },
  { id: "realestate", icon: "home",        color: "#10b981", bg: "#001612" },
  { id: "wholesale",  icon: "package",     color: "#4f46e5", bg: "#08071f" },
  { id: "documents",  icon: "file-text",   color: "#06b6d4", bg: "#001318" },
  { id: "nadworlek",  icon: "search",      color: "#ec4899", bg: "#1a0010" },
  { id: "beauty",     icon: "heart",       color: "#f43f5e", bg: "#1a0008" },
];

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const colors = useColors();
  const { t } = useLang();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const catKey = `cat${service.id.charAt(0).toUpperCase() + service.id.slice(1)}` as keyof typeof t;
  const subKey = `cat${service.id.charAt(0).toUpperCase() + service.id.slice(1)}Sub` as keyof typeof t;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/(tabs)/request", params: { category: t[catKey] as string } });
        }}
        style={[styles.card, { backgroundColor: service.bg, borderColor: service.color + "30", width: CARD_W }]}
        testID={`service-card-${service.id}`}
      >
        <View style={[styles.iconCircle, { backgroundColor: service.color + "20" }]}>
          <Feather name={service.icon as any} size={26} color={service.color} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: "right" }]}>
          {t[catKey] as string}
        </Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground, textAlign: "right" }]}>
          {t[subKey] as string}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const openWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(t.tagline)}`);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <Animated.View entering={FadeInUp.duration(600)} style={[styles.hero, { paddingTop: topPad + 24 }]}>
        <View style={[styles.heroBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
          <Ionicons name="location" size={13} color={colors.accent} />
          <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Libya · ليبيا</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground, writingDirection: isRTL ? "rtl" : "ltr" }]}>
          {t.appName}
        </Text>
        <Text style={[styles.heroTagline, { color: colors.primary }]}>{t.tagline}</Text>
        <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>{t.heroDesc}</Text>
        <Pressable
          style={[styles.waBtn, { backgroundColor: "#25d366" }]}
          onPress={openWhatsApp}
          testID="whatsapp-cta"
        >
          <Feather name="message-circle" size={18} color="#fff" />
          <Text style={styles.waBtnText}>{t.whatsapp}</Text>
        </Pressable>
      </Animated.View>

      {/* Stats strip */}
      <Animated.View entering={FadeInDown.delay(200).springify()}
        style={[styles.statsRow, { borderColor: colors.border }]}
      >
        {[["500+", isRTL ? "عميل" : "Clients"], ["1000+", isRTL ? "طلب" : "Orders"], ["15+", isRTL ? "مدينة" : "Cities"]].map(([n, l]) => (
          <View key={n} style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{n}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{l}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Services grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
          {t.servicesTitle}
        </Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
          {t.servicesSubtitle}
        </Text>
        <View style={styles.grid}>
          {SERVICES.map((s, i) => <ServiceCard key={s.id} service={s} index={i} />)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "center" },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, marginBottom: 20,
  },
  heroBadgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  heroTitle: { fontSize: 56, fontWeight: "800", letterSpacing: -1, marginBottom: 6 },
  heroTagline: { fontSize: 16, fontWeight: "600", marginBottom: 8, textAlign: "center" },
  heroDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  waBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 50,
  },
  waBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  statsRow: {
    flexDirection: "row", justifyContent: "space-around",
    marginHorizontal: 20, paddingVertical: 20,
    borderTopWidth: 1, borderBottomWidth: 1,
    marginBottom: 24,
  },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  card: {
    borderRadius: 18, padding: 16, borderWidth: 1,
    marginBottom: 0, gap: 8,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardSub: { fontSize: 11 },
});
