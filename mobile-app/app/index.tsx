import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAWERLI_URL = "https://dawerli.org.ly/";

const EXTERNAL_SCHEMES = ["wa.me", "api.whatsapp.com", "tel:", "mailto:", "maps.google", "geo:"];

function shouldOpenExternally(url: string): boolean {
  return EXTERNAL_SCHEMES.some((scheme) => url.includes(scheme));
}

export default function DawerliWebView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const handleRequest = (request: WebViewNavigation): boolean => {
    const { url } = request;

    if (shouldOpenExternally(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: error ? DAWERLI_URL : DAWERLI_URL }}
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
        onLoadStart={() => { setLoading(true); setError(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        onShouldStartLoadWithRequest={handleRequest}
        onNavigationStateChange={(navState) => {
          if (shouldOpenExternally(navState.url)) {
            Linking.openURL(navState.url).catch(() => {});
            webViewRef.current?.stopLoading();
          }
        }}
        userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 DawerliApp/1.0"
        testID="dawerli-webview"
      />

      {loading && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  webview: {
    flex: 1,
    backgroundColor: "#050505",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
  },
});
