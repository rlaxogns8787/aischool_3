import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { chatWithAI } from "../api/openai";
import Icon from "react-native-vector-icons/Ionicons";

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: Array<{
    text: string;
    value: number;
    selected?: boolean;
  }>;
};

// 옵션 버튼 컴포넌트
const OptionButton = ({
  text,
  onPress,
  selected,
}: {
  text: string;
  onPress: () => void;
  selected?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.optionButton, selected && styles.optionButtonSelected]}
    onPress={onPress}
  >
    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
      {text}
    </Text>
  </TouchableOpacity>
);

export default function ChatScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(true); // 옵션 표시 여부

  // 초기 메시지 설정
  useEffect(() => {
    const initialMessage: Message = {
      id: "1",
      text: `안녕하세요! 저는 여행 계획을 도와주는 AI 어시스턴트입니다.

먼저 진행하기전에 아래 두 옵션 중 하나를 선택을 해주세요. 이미 어느정도 정해진 일정이 있다면 1번, 여행을 염두하고 계시지만 어떻게 시작해야할 지 몰라 저와 함께 처음부터 같이 진행하고 싶다면 2번을 선택해주세요.`,
      isBot: true,
      timestamp: new Date().toISOString(),
      options: [
        { text: "1. 저는 이미 생각한 여행일정 있어요.", value: 1 },
        { text: "2. 여행은 가고싶지만 처음부터 도와주세요", value: 2 },
      ],
    };
    setMessages([initialMessage]);
  }, []);

  // 옵션 선택 처리
  const handleOptionSelect = async (option: number) => {
    setShowOptions(false);
    const optionText =
      option === 1
        ? "저는 이미 생각한 여행일정 있어요."
        : "여행은 가고싶지만 처음부터 도와주세요";

    await handleSendMessage(optionText);
  };

  const handleSendMessage = async (text: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const userText = text.toLowerCase();

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

      let aiResponse;
      // 1번 옵션 관련 다양한 입력 처리
      if (
        userText.includes("1") ||
        userText.includes("일정") ||
        userText.includes("이미") ||
        userText.includes("있어") ||
        userText.includes("첫번째") ||
        userText.includes("1번")
      ) {
        aiResponse = await chatWithAI(
          "어떤 지역으로 여행을 계획하고 계신가요?"
        );
      }
      // 2번 옵션 관련 다양한 입력 처리
      else if (
        userText.includes("2") ||
        userText.includes("처음") ||
        userText.includes("도와") ||
        userText.includes("두번째") ||
        userText.includes("2번")
      ) {
        aiResponse = await chatWithAI(
          "좋습니다. 함께 여행 계획을 세워보아요. 먼저, 어떤 지역으로 여행을 가고 싶으신가요?"
        );
      } else {
        aiResponse = await chatWithAI(text);
      }

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
      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>AI 여행 플래너</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.messageList}>
          <MessageList
            messages={messages}
            onOptionSelect={handleOptionSelect}
          />
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
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 10,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 44, // backButton의 너비만큼 오프셋
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
  messageGroup: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 16,
  },
  botBubble: {
    backgroundColor: "#F2F2F7",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  optionsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  optionButton: {
    borderRadius: 20,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  optionButtonSelected: {
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "left",
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },
});
