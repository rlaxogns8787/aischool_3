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
  styleOptions?: Array<{
    text: string;
    value: string;
    selected: boolean;
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
      // 여행 스타일 선택 처리
      if (
        userText.includes("자연") ||
        userText.includes("힐링") ||
        userText.includes("문화") ||
        userText.includes("역사") ||
        userText.includes("맛집") ||
        userText.includes("쇼핑") ||
        userText.includes("액티비티") ||
        userText.includes("체험") ||
        userText.match(/[1-4][)]/)
      ) {
        // 선택한 스타일 확인 메시지 추가
        const confirmMessage: Message = {
          id: Date.now().toString(),
          text: "알겠습니다. 선택하신 여행 스타일을 참고하겠습니다.",
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        // 다음 질문 메시지
        const nextQuestion: Message = {
          id: (Date.now() + 1).toString(),
          text: "희망하시는 국내 여행지가 있으신가요?",
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== "loading")
            .concat([confirmMessage, nextQuestion])
        );
        return;
      }

      // 1번 옵션 선택 시 (기존 일정 등록)
      if (
        userText.includes("1") ||
        userText.includes("일정") ||
        userText.includes("이미") ||
        userText.includes("있어") ||
        userText.includes("첫번째") ||
        userText.includes("1번")
      ) {
        aiResponse = await chatWithAI(
          "일정에 대해 말씀해 주시면 등록해드리겠습니다."
        );
      }
      // 2번 옵션 선택 시 (맞춤 일정 추천)
      else if (
        userText.includes("2") ||
        userText.includes("처음") ||
        userText.includes("도와") ||
        userText.includes("두번째") ||
        userText.includes("2번")
      ) {
        // 여행 스타일 선택 옵션
        const styleOptions = {
          text: "선호하는 여행 스타일을 선택해주세요 (여러 개 선택 가능):",
          styleOptions: [
            { text: "자연", value: "nature", selected: false },
            { text: "힐링", value: "healing", selected: false },
            { text: "액티비티", value: "activity", selected: false },
            { text: "문화", value: "culture", selected: false },
            { text: "체험", value: "experience", selected: false },
            { text: "역사", value: "history", selected: false },
            { text: "쇼핑", value: "shopping", selected: false },
            { text: "맛집", value: "food", selected: false },
          ],
        };
        aiResponse = styleOptions;
      }
      // 일반 대화
      else {
        aiResponse = await chatWithAI(text);
      }

      // 로딩 메시지 제거
      setMessages((prev) => prev.filter((msg) => msg.id !== "loading"));

      // AI 메시지 추가
      const botMessage: Message = {
        id: Date.now().toString(),
        text: typeof aiResponse === "string" ? aiResponse : aiResponse.text,
        isBot: true,
        timestamp: new Date().toISOString(),
        options: aiResponse.options, // 옵션이 있는 경우에만 추가됨
        styleOptions: aiResponse.styleOptions, // 스타일 옵션이 있는 경우에만 추가됨
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== "loading"));

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

  // 스타일 토글 처리 함수 추가
  const handleStyleToggle = (value: string) => {
    setMessages((prev) => {
      return prev.map((msg) => {
        if (msg.styleOptions) {
          return {
            ...msg,
            styleOptions: msg.styleOptions.map((option) => ({
              ...option,
              selected:
                option.value === value ? !option.selected : option.selected,
            })),
          };
        }
        return msg;
      });
    });
  };

  // 스타일 선택 완료 처리
  const handleStyleSelectComplete = () => {
    // 선택된 스타일들 확인
    const selectedStyles = messages
      .find((msg) => msg.styleOptions)
      ?.styleOptions?.filter((opt) => opt.selected)
      .map((opt) => opt.text);

    if (selectedStyles && selectedStyles.length > 0) {
      // 선택 확인 메시지
      const confirmMessage: Message = {
        id: Date.now().toString(),
        text: `${selectedStyles.join(", ")}을(를) 선택하셨네요. 좋습니다!`,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      // 다음 질문 메시지
      const nextQuestion: Message = {
        id: (Date.now() + 1).toString(),
        text: "희망하시는 국내 여행지가 있으신가요?",
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, confirmMessage, nextQuestion]);
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
            onStyleToggle={handleStyleToggle}
            onStyleSelectComplete={handleStyleSelectComplete}
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
