import React, { useState, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { chatWithAI } from "../api/openai";

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 초기 메시지 설정
  useEffect(() => {
    const initialMessage: Message = {
      id: "1",
      text: `안녕하세요! 저는 여행 계획을 도와주는 AI 어시스턴트입니다.

어떤 여행을 계획하고 계신가요?
예시:
1. "서울로 2박 3일 여행 가려고 해요"
2. "제주도 3박 4일 가족여행 추천해주세요"`,
      isBot: true,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialMessage]);
  }, []);

  const handleSendMessage = async (text: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      // 사용자 메시지 추가
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        isBot: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 로딩 메시지 추가
      const loadingMessage: Message = {
        id: "loading",
        text: "답변을 생성하고 있습니다...",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, loadingMessage]);

      // AI 응답 받기
      const aiResponse = await chatWithAI(text);

      // 로딩 메시지 제거
      setMessages((prev) => prev.filter((msg) => msg.id !== "loading"));

      // AI 메시지 추가
      const botMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      // 로딩 메시지 제거
      setMessages((prev) => prev.filter((msg) => msg.id !== "loading"));

      // 에러 메시지 추가
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.messageList}>
          <MessageList messages={messages} />
        </View>
        <View style={styles.inputContainer}>
          <MessageInput onSend={handleSendMessage} disabled={isLoading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoid: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
});
