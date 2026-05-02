import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>حدث خطأ ما</Text>
      <Text style={styles.message}>اضغط أدناه لإعادة المحاولة</Text>
      <Pressable
        onPress={resetError}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.buttonText}>إعادة المحاولة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#9ca3af",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
  },
});
