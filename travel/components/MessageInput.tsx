import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Send, Mic } from "lucide-react-native";

type MessageInputProps = {
  onSend: (text: string) => Promise<void>;
  onVoiceStart: () => void;
  isListening: boolean;
  disabled: boolean;
};

export default function MessageInput({
  onSend,
  onVoiceStart,
  isListening,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSend = async () => {
    if (text.trim() && !disabled) {
      await onSend(text.trim());
      setText("");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.container}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력하세요..."
          multiline
          autoFocus={false}
          editable={!disabled}
        />
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={disabled || !text.trim()}
        >
          <Send size={24} color={disabled ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  inputDisabled: {
    backgroundColor: "#E5E5EA",
  },
  button: {
    padding: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
