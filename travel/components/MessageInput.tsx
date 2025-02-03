import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Send, Mic } from "lucide-react-native";

type MessageInputProps = {
  onSend: (text: string) => void;
  onVoiceStart?: () => void;
  isListening?: boolean;
};

export default function MessageInput({
  onSend,
  onVoiceStart,
  isListening = false,
}: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor="#8E8E93"
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, text.trim() ? styles.activeButton : null]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Send size={20} color={text.trim() ? "#FFFFFF" : "#8E8E93"} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
        onPress={onVoiceStart}
      >
        <Mic size={24} color={isListening ? "#FFFFFF" : "#007AFF"} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 32,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 16,
    color: "#000",
    ...Platform.select({
      ios: {
        paddingTop: 4,
      },
      android: {
        paddingTop: 4,
      },
    }),
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButtonActive: {
    backgroundColor: "#FF3B30",
  },
  activeButton: {
    backgroundColor: "#007AFF",
  },
});
