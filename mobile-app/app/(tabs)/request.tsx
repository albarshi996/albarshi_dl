import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LangContext";
import { WA_PHONE } from "@/constants/i18n";

type PayMethod = "cash" | "bank" | "online";

export default function RequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const params = useLocalSearchParams<{ category?: string }>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(params.category ?? "");
  const [details, setDetails] = useState("");
  const [qty, setQty] = useState("1");
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const phoneRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const detailsRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t.required;
    if (!phone.trim()) e.phone = t.required;
    else if (!/^[0-9+\s]{7,15}$/.test(phone.trim())) e.phone = t.validPhone;
    if (!city.trim()) e.city = t.required;
    if (!details.trim()) e.details = t.required;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const payLabel = { cash: t.pmCash, bank: t.pmBank, online: t.pmOnline }[payMethod];

  const submit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    const msg = t.orderMsg
      .replace("{name}", name)
      .replace("{phone}", phone)
      .replace("{city}", city)
      .replace("{category}", category || "-")
      .replace("{details}", details)
      .replace("{qty}", qty)
      .replace("{payment}", payLabel);
    await Linking.openURL(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`);
    setSending(false);
  };

  const PAYMENT_OPTIONS: { id: PayMethod; icon: string; color: string }[] = [
    { id: "cash",   icon: "dollar-sign", color: "#10b981" },
    { id: "bank",   icon: "credit-card", color: colors.primary },
    { id: "online", icon: "wifi",        color: "#f59e0b" },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100,
        paddingHorizontal: 16,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
        {t.requestTitle}
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {t.requestSubtitle}
      </Text>

      {/* Form fields */}
      {([
        { key: "name",    label: t.fieldName,     value: name,    setter: setName,    keyboardType: "default",       ref: null,      next: phoneRef,   returnKey: "next" },
        { key: "phone",   label: t.fieldPhone,    value: phone,   setter: setPhone,   keyboardType: "phone-pad",     ref: phoneRef,  next: cityRef,    returnKey: "next" },
        { key: "city",    label: t.fieldCity,     value: city,    setter: setCity,    keyboardType: "default",       ref: cityRef,   next: detailsRef, returnKey: "next" },
        { key: "details", label: t.fieldDetails,  value: details, setter: setDetails, keyboardType: "default",       ref: detailsRef, next: null,      returnKey: "done", multiline: true },
      ] as const).map(({ key, label, value, setter, keyboardType, ref, next, returnKey, multiline }) => (
        <Animated.View key={key} entering={FadeInDown.delay(50).springify()}>
          <Text style={[styles.label, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
            {label}
          </Text>
          <TextInput
            ref={ref as any}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors[key] ? colors.destructive : colors.border,
                color: colors.foreground,
                textAlign: isRTL ? "right" : "left",
                height: multiline ? 80 : 48,
              },
            ]}
            value={value}
            onChangeText={setter as (v: string) => void}
            keyboardType={keyboardType as any}
            returnKeyType={returnKey as any}
            onSubmitEditing={() => next?.current?.focus()}
            multiline={!!multiline}
            blurOnSubmit={!multiline}
            placeholderTextColor={colors.mutedForeground}
            placeholder={label}
            testID={`input-${key}`}
          />
          {errors[key] && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errors[key]}</Text>
          )}
        </Animated.View>
      ))}

      {/* Qty */}
      <Text style={[styles.label, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {t.fieldQty}
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, textAlign: isRTL ? "right" : "left", height: 48 }]}
        value={qty}
        onChangeText={setQty}
        keyboardType="numeric"
        returnKeyType="done"
        placeholderTextColor={colors.mutedForeground}
        testID="input-qty"
      />

      {/* Payment method */}
      <Text style={[styles.label, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left", marginTop: 8 }]}>
        {t.paymentMethod}
      </Text>
      <View style={styles.payRow}>
        {PAYMENT_OPTIONS.map(({ id, icon, color }) => {
          const active = payMethod === id;
          const pmLabel = { cash: t.pmCash, bank: t.pmBank, online: t.pmOnline }[id];
          const pmSub   = { cash: t.pmCashSub, bank: t.pmBankSub, online: t.pmOnlineSub }[id];
          return (
            <Pressable
              key={id}
              style={[
                styles.payCard,
                {
                  backgroundColor: active ? color + "20" : colors.card,
                  borderColor: active ? color : colors.border,
                  flex: 1,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setPayMethod(id);
              }}
              testID={`pay-${id}`}
            >
              <Feather name={icon as any} size={20} color={active ? color : colors.mutedForeground} />
              <Text style={[styles.payLabel, { color: active ? color : colors.foreground }]}>{pmLabel}</Text>
              <Text style={[styles.paySub, { color: colors.mutedForeground }]}>{pmSub}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Submit */}
      <Pressable
        style={[styles.submitBtn, { backgroundColor: "#25d366", opacity: sending ? 0.7 : 1 }]}
        onPress={submit}
        disabled={sending}
        testID="submit-btn"
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.submitText}>{t.submitBtn}</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15,
  },
  errorText: { fontSize: 11, marginTop: 4, marginHorizontal: 4 },
  payRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  payCard: {
    padding: 12, borderRadius: 14, borderWidth: 1,
    alignItems: "center", gap: 4,
  },
  payLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  paySub: { fontSize: 9, textAlign: "center" },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, marginTop: 28, paddingVertical: 16,
    borderRadius: 50,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
