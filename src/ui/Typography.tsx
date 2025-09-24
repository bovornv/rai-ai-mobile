import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";

export function Title(props: TextProps) {
  return <Text {...props} style={[styles.title, props.style]} />;
}

export function Body(props: TextProps) {
  return <Text {...props} style={[styles.body, props.style]} />;
}

export function LargeTitle(props: TextProps) {
  return <Text {...props} style={[styles.largeTitle, props.style]} />;
}

export function SmallText(props: TextProps) {
  return <Text {...props} style={[styles.smallText, props.style]} />;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 22, // big headline
    lineHeight: 28,
    color: "#333333",
  },
  largeTitle: {
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 28, // extra big for main titles
    lineHeight: 36,
    color: "#333333",
  },
  body: {
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 18, // large body
    lineHeight: 24,
    color: "#333333",
  },
  smallText: {
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 14, // smaller text
    lineHeight: 20,
    color: "#666666",
  },
});
