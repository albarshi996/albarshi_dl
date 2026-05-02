import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LangContext";
import { WA_PHONE } from "@/constants/i18n";

const STEPS = [
  { icon: "check-circle", labelAr: "استلام الطلب", labelEn: "Order Received" },
  { icon: "search",       labelAr: "جاري البحث",   labelEn: "Searching" },
  { icon: "shopping-bag", labelAr: "تم الشراء",    labelEn: "Purchased" },
  { icon: "truck",        labelAr: "في الطريق",    labelEn: "On the way" },
  { icon: "home",         labelAr: "تم التوصيل",   labelEn: "Delivered" },
];

export default function TrackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleTrack = () => {
    if (!orderId.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearched(true);
  };

  const openWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = isRTL
      ? `مرحباً، أريد الاستفسار عن طلبي: ${orderId || "..."}`
      : `Hello, I want to ask about my order: ${orderId || "..."}`;
    Linking.openURL(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}>
      <Animated.View entering={FadeInUp.duration(500)} style={{ paddingHorizontal: 20 }}>
        <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
          {t.trackTitle}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
          {t.trackSubtitle}
        </Text>

        {/* Search bar */}
        <View style={[styles.searchRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <TextInput
            style={[styles.searchInput, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              textAlign: isRTL ? "right" : "left",
            }]}
            value={orderId}
            onChangeText={setOrderId}
            placeholder={t.trackPlaceholder}
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            onSubmitEditing={handleTrack}
            testID="track-input"
          />
          <Pressable
            style={[styles.searchBtn, { backgroundColor: colors.primary }]}
            onPress={handleTrack}
            testID="track-btn"
          >
            <Feather name="search" size={20} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>

      {/* Status timeline — shown after search */}
      {searched && (
        <Animated.View entering={FadeInDown.springify()} style={styles.timeline}>
          {STEPS.map((step, i) => {
            const done = i < 2;
            const active = i === 2;
            return (
              <View key={i} style={[styles.stepRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepDot,
                    { backgroundColor: done || active ? colors.primary : colors.border }
                  ]}>
                    <Feather name={step.icon as any} size={14} color={done || active ? "#fff" : colors.mutedForeground} />
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: done ? colors.primary : colors.border }]} />
                  )}
                </View>
                <View style={[styles.stepInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                  <Text style={[styles.stepLabel, {
                    color: done || active ? colors.foreground : colors.mutedForeground,
                    fontWeight: active ? "700" : "500",
                  }]}>
                    {isRTL ? step.labelAr : step.labelEn}
                  </Text>
                  {active && (
                    <Text style={[styles.stepActive, { color: colors.primary }]}>
                      {isRTL ? "الحالة الحالية" : "Current status"}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.View>
      )}

      {/* WhatsApp contact */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.contactSection}>
        <Text style={[styles.contactTitle, { color: colors.mutedForeground }]}>
          {t.trackContact}
        </Text>
        <Pressable
          style={[styles.waBtn, { backgroundColor: "#25d366" }]}
          onPress={openWhatsApp}
          testID="track-whatsapp"
        >
          <Feather name="message-circle" size={18} color="#fff" />
          <Text style={styles.waBtnText}>{t.trackWhatsApp}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  searchRow: { gap: 10, marginBottom: 24 },
  searchInput: {
    flex: 1, height: 50, borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, fontSize: 14,
  },
  searchBtn: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  timeline: { paddingHorizontal: 24, marginBottom: 24 },
  stepRow: { gap: 14, marginBottom: 0 },
  stepLeft: { alignItems: "center", width: 32 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  stepLine: { width: 2, height: 28, marginVertical: 2 },
  stepInfo: { flex: 1, paddingTop: 6 },
  stepLabel: { fontSize: 14 },
  stepActive: { fontSize: 11, marginTop: 2, fontWeight: "600" },
  contactSection: { paddingHorizontal: 20, alignItems: "center", gap: 12 },
  contactTitle: { fontSize: 13 },
  waBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50,
  },
  waBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
