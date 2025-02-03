import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mic } from "lucide-react-native";
import { Audio } from "expo-av";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import * as Speech from "expo-speech";

type ChatScreenProps = {
  navigation: any;
};

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: { text: string; value: string }[];
};

type MessageInputProps = {
  onSend: (text: string) => void;
  onVoiceStart?: () => void;
  isListening?: boolean;
};

export default function ChatScreen({ navigation }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [tempText, setTempText] = useState("");
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const BOT_URL = "http://172.30.1.19:3978/api/messages";

  // 음성 인식 토글
  const toggleVoiceRecognition = async () => {
    try {
      if (isListening) {
        // 음성 인식 중지
        setIsListening(false);
        // 테스트용 텍스트를 메시지로 전송
        if (tempText.trim()) {
          sendMessage(tempText.trim());
          setTempText("");
        }
      } else {
        // 음성 인식 시작
        setIsListening(true);
        setTempText("");

        // 테스트용: 3초 후에 예시 텍스트 설정
        setTimeout(() => {
          setTempText("서울로 여행을 가고 싶습니다");
          Speech.speak(
            "음성이 인식되었습니다. 마이크를 다시 눌러 전송하세요.",
            {
              language: "ko",
              onDone: () => {
                console.log("Speech finished");
              },
            }
          );
        }, 3000);
      }
    } catch (error) {
      console.error("Error in voice recognition:", error);
      setIsListening(false);
      Alert.alert("오류", "음성 인식을 시작할 수 없습니다.");
    }
  };

  // 파동 애니메이션
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // 챗봇 응답 처리 함수
  const handleBotResponse = (userText: string): string => {
    const text = userText.toLowerCase();

    // 1번 옵션 관련 다양한 입력 처리
    if (
      text.includes("1") ||
      text.includes("일정") ||
      text.includes("이미") ||
      text.includes("있어") ||
      text.includes("첫번째") ||
      text.includes("1번")
    ) {
      return "어떤 지역으로 여행을 계획하고 계신가요?";
    }
    // 2번 옵션 관련 다양한 입력 처리
    else if (
      text.includes("2") ||
      text.includes("처음") ||
      text.includes("도와") ||
      text.includes("두번째") ||
      text.includes("2번")
    ) {
      return "좋습니다. 함께 여행 계획을 세워보아요. 먼저, 어떤 지역으로 여행을 가고 싶으신가요?";
    }
    // 지역 선택 후 처리
    else if (text.includes("서울")) {
      return "서울로 정하셨군요! 여행 기간은 어떻게 되시나요? (예: 2박 3일)";
    } else if (text.includes("2박")) {
      return "1박2일";
    } else {
      return "죄송합니다. 1번 또는 2번 중에서 선택해주세요.";
    }
  };

  const sendMessage = async (text: string) => {
    try {
      // 사용자 메시지 추가
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        isBot: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 봇 응답 생성
      const botResponse = handleBotResponse(text);

      // 봇 응답 추가
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text:
          error instanceof Error
            ? `오류가 발생했습니다: ${error.message}`
            : "메시지 처리 중 오류가 발생했습니다.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // 초기 메시지 설정
  useEffect(() => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: "먼저 진행하기전에 아래 두 옵션 중 하나를 선택을 해주세요:",
      isBot: true,
      timestamp: new Date().toISOString(),
      options: [
        { text: "1. 저는 이미 생각한 여행일정 있어요.", value: "1" },
        { text: "2. 여행은 가고싶지만 처음부터 도와주세요.", value: "2" },
      ],
    };
    setMessages([initialMessage]);
  }, []);

  const handleOptionSelect = (option: string) => {
    sendMessage(option);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>여행 플래너</Text>
          </View>
        </View>

        <View style={styles.voiceBar}>
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={toggleVoiceRecognition}
          >
            <Animated.View
              style={[styles.voiceIcon, { transform: [{ scale: pulseAnim }] }]}
            >
              <View
                style={[
                  styles.voiceWave,
                  isListening && styles.voiceWaveActive,
                ]}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.voiceText}>
            {isListening
              ? tempText
                ? `음성 인식 중...\n${tempText}`
                : "음성 인식 중... 말씀해 주세요."
              : "마이크를 탭하여 음성으로 이야기하세요."}
          </Text>
        </View>

        <MessageList messages={messages} onOptionSelect={handleOptionSelect} />
        <MessageInput
          onSend={sendMessage}
          onVoiceStart={toggleVoiceRecognition}
          isListening={isListening}
        />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
    marginLeft: -28, // 뒤로가기 버튼 너비만큼 보정
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  voiceBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F2F2F7",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  voiceButton: {
    padding: 4,
  },
  voiceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  voiceWave: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    opacity: 0.8,
  },
  voiceWaveActive: {
    backgroundColor: "#FF3B30",
  },
  voiceText: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    lineHeight: 18,
  },
});
