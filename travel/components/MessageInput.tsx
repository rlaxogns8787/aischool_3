import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Send, Mic } from "lucide-react-native";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function MessageInput({
  onSend,
  disabled,
  autoFocus,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.container}>
        <TextInput
          ref={inputRef}
          style={[styles.input, disabled && styles.inputDisabled]}
          placeholder="메시지를 입력하세요..."
          value={message}
          onChangeText={setMessage}
          multiline
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          enablesReturnKeyAutomatically
          keyboardType="default"
          returnKeyType="send"
          onSubmitEditing={() => {
            if (message.trim() && !disabled) {
              onSend(message.trim());
              setMessage("");
              Keyboard.dismiss();
            }
          }}
        />
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={() => {
            if (message.trim() && !disabled) {
              onSend(message.trim());
              setMessage("");
              Keyboard.dismiss();
            }
          }}
          disabled={!message.trim() || disabled}
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
