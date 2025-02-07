import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type StyleToggleButtonProps = {
  text: string;
  selected: boolean;
  onPress: () => void;
};

export default function StyleToggleButton({
  text,
  selected,
  onPress,
}: StyleToggleButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, selected && styles.buttonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
    alignSelf: "flex-start",
    backgroundColor: "#F8F8F8",
  },
  buttonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  text: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  textSelected: {
    color: "#FFFFFF",
  },
});
