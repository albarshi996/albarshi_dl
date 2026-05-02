import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

const DAWERLI_URL = "https://dawerli.org.ly/";
const PRIMARY = "#4f46e5";
const DISABLED = "#2d2d3a";
const BG = "#050505";
const TOOLBAR_BG = "#0d0d14";
const BORDER = "#1a1a2e";

const EXTERNAL_SCHEMES = [
  "wa.me",
  "api.whatsapp.com",
  "tel:",
  "mailto:",
  "maps.google",
  "geo:",
];

function shouldOpenExternally(url: string): boolean {
  return EXTERNAL_SCHEMES.some((s) => url.includes(s));
}

function ToolbarBtn({
  icon,
  onPress,
  disabled,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.toolbarBtn,
        { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}
    >
      <Feather name={icon} size={22} color={disabled ? DISABLED : PRIMARY} />
    </Pressable>
  );
}

export default function DawerliWebView() {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [pageTitle, setPageTitle] = useState("دورلي");
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRequest = (request: WebViewNavigation): boolean => {
    if (shouldOpenExternally(request.url)) {
      Linking.openURL(request.url).catch(() => {});
      return false;
    }
    return true;
  };

  const handleNavStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    if (navState.title && navState.title.trim()) {
      setPageTitle(navState.title);
    }
    if (shouldOpenExternally(navState.url)) {
      Linking.openURL(navState.url).catch(() => {});
      webViewRef.current?.stopLoading();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* WebView */}
      <View style={styles.webviewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: DAWERLI_URL }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState={false}
          scalesPageToFit={false}
          bounces={true}
          pullToRefreshEnabled={true}
          allowsBackForwardNavigationGestures={true}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          onShouldStartLoadWithRequest={handleRequest}
          onNavigationStateChange={handleNavStateChange}
          userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 DawerliApp/1.1"
          testID="dawerli-webview"
        />

        {loading && (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        )}
      </View>

      {/* Bottom Toolbar */}
      <View
        style={[
          styles.toolbar,
          { paddingBottom: bottomInset > 0 ? bottomInset : 8 },
        ]}
      >
        {/* Loading progress bar */}
        {loading && <View style={styles.progressBar} />}

        <View style={styles.toolbarInner}>
          <ToolbarBtn
            icon="chevron-left"
            label="رجوع"
            disabled={!canGoBack}
            onPress={() => webViewRef.current?.goBack()}
          />

          <ToolbarBtn
            icon="chevron-right"
            label="تقدم"
            disabled={!canGoForward}
            onPress={() => webViewRef.current?.goForward()}
          />

          <View style={styles.titleWrap}>
            <Text
              style={styles.titleText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {loading ? "جاري التحميل..." : pageTitle}
            </Text>
          </View>

          <ToolbarBtn
            icon="rotate-cw"
            label="تحديث"
            onPress={() => {
              Keyboard.dismiss();
              webViewRef.current?.reload();
            }}
          />

          <ToolbarBtn
            icon="home"
            label="الرئيسية"
            onPress={() => {
              Keyboard.dismiss();
              webViewRef.current?.injectJavaScript(
                `window.location.href = '${DAWERLI_URL}'; true;`
              );
            }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  webviewWrapper: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: BG,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
  },
  toolbar: {
    backgroundColor: TOOLBAR_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  progressBar: {
    height: 2,
    backgroundColor: PRIMARY,
    width: "60%",
    alignSelf: "flex-start",
    borderRadius: 1,
    opacity: 0.8,
  },
  toolbarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  toolbarBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  titleText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
