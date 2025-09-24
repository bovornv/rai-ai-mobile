import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

interface LargeButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
}

export default function LargeButton({
  label,
  onPress,
  style,
  variant = "primary",
  disabled = false,
}: LargeButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = [styles.btn];
    
    switch (variant) {
      case "primary":
        baseStyle.push(styles.primary);
        break;
      case "secondary":
        baseStyle.push(styles.secondary);
        break;
      case "outline":
        baseStyle.push(styles.outline);
        break;
    }
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    switch (variant) {
      case "primary":
        baseStyle.push(styles.primaryText);
        break;
      case "secondary":
        baseStyle.push(styles.secondaryText);
        break;
      case "outline":
        baseStyle.push(styles.outlineText);
        break;
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledText);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={getButtonStyle()}
      accessibilityRole="button"
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={getTextStyle()}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    minHeight: 56, // big touch target
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  primary: {
    backgroundColor: "#4CAF50",
  },
  secondary: {
    backgroundColor: "#2196F3",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  disabled: {
    backgroundColor: "#E0E0E0",
    borderColor: "#E0E0E0",
  },
  text: {
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: "#FFFFFF",
  },
  outlineText: {
    color: "#4CAF50",
  },
  disabledText: {
    color: "#9E9E9E",
  },
});
