import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Linking,
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
import { WA_PHONE, FACEBOOK_URL, EMAIL } from "@/constants/i18n";

function Row({
  icon, label, sub, color, onPress, index,
}: {
  icon: string; label: string; sub?: string;
  color?: string; onPress: () => void; index: number;
}) {
  const colors = useColors();
  const { isRTL } = useLang();
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? "row-reverse" : "row" }]}
        onPress={onPress}
        testID={`more-row-${label}`}
      >
        <View style={[styles.rowIcon, { backgroundColor: (color ?? colors.primary) + "20" }]}>
          <Feather name={icon as any} size={20} color={color ?? colors.primary} />
        </View>
        <View style={[styles.rowInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
          {sub && <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{sub}</Text>}
        </View>
        <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, toggleLang, lang } = useLang();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const tap = (fn: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

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
      {/* Logo/Brand */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.brand}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
          <Text style={[styles.logoText, { color: colors.primary }]}>د</Text>
        </View>
        <Text style={[styles.brandName, { color: colors.foreground }]}>{t.appName}</Text>
        <Text style={[styles.brandTagline, { color: colors.mutedForeground }]}>{t.tagline}</Text>
      </Animated.View>

      {/* Language */}
      <Text style={[styles.sectionHead, { color: colors.mutedForeground }]}>
        {lang === "ar" ? "اللغة" : "Language"}
      </Text>
      <Row
        icon="globe" label={t.langToggle}
        sub={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
        color={colors.accent} index={0}
        onPress={() => tap(toggleLang)}
      />

      {/* Contact */}
      <Text style={[styles.sectionHead, { color: colors.mutedForeground }]}>
        {t.contactUs}
      </Text>
      <Row icon="message-circle" label={t.whatsapp}  sub={`+218 946 507 954`} color="#25d366" index={1}
        onPress={() => tap(() => Linking.openURL(`https://wa.me/${WA_PHONE}`))} />
      <Row icon="facebook"       label={t.facebook}  sub="@dawerli" color="#1877f2" index={2}
        onPress={() => tap(() => Linking.openURL(FACEBOOK_URL))} />
      <Row icon="mail"           label={t.email}     sub={EMAIL} color={colors.accent} index={3}
        onPress={() => tap(() => Linking.openURL(`mailto:${EMAIL}`))} />

      {/* About */}
      <Text style={[styles.sectionHead, { color: colors.mutedForeground }]}>
        {t.aboutUs}
      </Text>
      <Animated.View entering={FadeInDown.delay(240).springify()}
        style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.aboutText, { color: colors.mutedForeground, textAlign: lang === "ar" ? "right" : "left" }]}>
          {t.aboutText}
        </Text>
      </Animated.View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        {t.version} · dawerli.org.ly
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brand: { alignItems: "center", marginBottom: 28, gap: 8 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  logoText: { fontSize: 36, fontWeight: "800" },
  brandName: { fontSize: 28, fontWeight: "800" },
  brandTagline: { fontSize: 12, textAlign: "center" },
  sectionHead: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 20, marginLeft: 4 },
  row: {
    alignItems: "center", gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12 },
  aboutCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  aboutText: { fontSize: 14, lineHeight: 22 },
  version: { textAlign: "center", fontSize: 11, marginTop: 20 },
});
