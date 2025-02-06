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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mic } from "lucide-react-native";
import { Audio } from "expo-av";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import * as Speech from "expo-speech";
import OptionCard from "../components/OptionCard";
import OptionModal from "../components/OptionModal";
import Voice from "@react-native-voice/voice";
import { useAzureServices } from "../hooks/useAzureServices";

type ChatScreenProps = {
  navigation: any;
};

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: { text: string; value: string }[];
  questions?: string[];
  searchResults?: any[];
};

type TravelInfo = {
  destination?: string;
  dates?: { start: string; end: string };
  people?: number;
  companions?: string;
  activities?: string[];
  budget?: number;
};

export default function ChatScreen({ navigation }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [travelInfo, setTravelInfo] = useState<TravelInfo>({});
  const [isListening, setIsListening] = useState(false);
  const [tempText, setTempText] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const BOT_URL = "https://038c-175-195-146-122.ngrok-free.app/api/messages";
  const SPEECH_API_URL =
    "https://038c-175-195-146-122.ngrok-free.app/api/speech-to-text";

  const [isModalVisible, setModalVisible] = useState(false);

  const { searchDestinations, generateSchedule } = useAzureServices();

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
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

  const toggleVoiceRecognition = async () => {
    try {
      if (isListening) {
        // 음성 인식 중지
        setIsListening(false);

        if (recording) {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          setRecording(null);

          // 녹음된 오디오를 서버로 전송
          if (uri) {
            try {
              const formData = new FormData();
              formData.append("audio", {
                uri: uri,
                type: "audio/m4a", // iOS에서는 m4a 형식으로 녹음됨
                name: "speech.m4a",
              } as any);

              console.log("Sending audio to server:", SPEECH_API_URL);
              const response = await fetch(SPEECH_API_URL, {
                method: "POST",
                body: formData,
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              console.log("Server response status:", response.status);
              const result = await response.json();
              console.log("Converted text:", result.text);

              if (result.text) {
                setTempText(result.text);
                sendMessage(result.text); // 변환된 텍스트를 채팅창에 전송
              } else {
                Alert.alert(
                  "알림",
                  "음성을 인식하지 못했습니다. 다시 시도해주세요."
                );
              }
            } catch (error) {
              console.error("Error sending audio to server:", error);
              Alert.alert("오류", "음성 변환 중 오류가 발생했습니다.");
            }
          }
        }
      } else {
        // 마이크 권한 요청
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status === "granted") {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });

          // 녹음 시작 - 고품질 설정
          const { recording } = await Audio.Recording.createAsync({
            android: {
              extension: ".m4a",
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 128000,
            },
            ios: {
              extension: ".m4a",
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 128000,
              linearPCM: false,
            },
          });

          setRecording(recording);
          setIsListening(true);
          setTempText("음성 인식 중...");
        } else {
          Alert.alert(
            "권한 필요",
            "음성 인식을 위해 마이크 권한이 필요합니다."
          );
        }
      }
    } catch (error) {
      console.error("Error in voice recognition:", error);
      setIsListening(false);
      Alert.alert("오류", "음성 인식을 시작할 수 없습니다.");
    }
  };

  // 챗봇 응답 처리 함수
  const handleBotResponse = async (userText: string): Promise<Message> => {
    const text = userText.toLowerCase();

    try {
      // 여행 정보가 충분히 수집되었는지 확인
      if (
        travelInfo.destination &&
        travelInfo.people &&
        travelInfo.companions &&
        (text.includes("관광") ||
          text.includes("맛집") ||
          text.includes("쇼핑"))
      ) {
        // 활동 정보 저장
        setTravelInfo((prev) => ({
          ...prev,
          activities: [...(prev.activities || []), text],
        }));

        try {
          // AI로 일정 생성
          const schedule = await generateSchedule(travelInfo);

          return {
            id: Date.now().toString(),
            text: "입력하신 정보를 바탕으로 다음과 같은 일정을 추천드립니다:",
            isBot: true,
            timestamp: new Date().toISOString(),
            schedule, // AI가 생성한 일정
            options: [
              { text: "📝 일정 수정하기", value: "modify" },
              { text: "✅ 이 일정으로 확정하기", value: "confirm" },
            ],
          };
        } catch (error) {
          console.error("Schedule generation error:", error);
          return {
            id: Date.now().toString(),
            text: "죄송합니다. 일정 생성 중 오류가 발생했습니다.",
            isBot: true,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // 1번: 직접 일정 입력
      if (
        text.includes("1") ||
        text.includes("일정") ||
        text.includes("이미")
      ) {
        return {
          id: Date.now().toString(),
          text: "여행 일정을 등록하기 위해 아래 정보를 알려주세요:",
          isBot: true,
          timestamp: new Date().toISOString(),
          questions: [
            "1. 여행지는 어디인가요?",
            "2. 여행 기간은 언제인가요?",
            "3. 몇 명이 함께 여행하시나요?",
            "4. 동반자(가족, 친구 등)가 있나요?",
            "5. 주요 활동 계획을 알려주세요",
            "6. 예상 예산을 알려주세요",
          ],
        };
      }

      // 2번: AI 추천 받기
      if (
        text.includes("2") ||
        text.includes("처음") ||
        text.includes("도와")
      ) {
        return {
          id: Date.now().toString(),
          text: "맞춤형 여행 계획을 추천해드리겠습니다. 아래 정보를 알려주세요:",
          isBot: true,
          timestamp: new Date().toISOString(),
          questions: [
            "1. 희망하는 여행지가 있나요?",
            "2. 언제 여행을 가고 싶으신가요?",
            "3. 몇 명이 함께 여행하시나요?",
            "4. 동반자(가족, 친구 등)가 있나요?",
            "5. 선호하는 활동이 있나요? (예: 관광, 맛집, 쇼핑 등)",
            "6. 예산은 어느 정도로 생각하시나요?",
          ],
        };
      }

      // 여행지 입력 감지 및 정보 저장
      if (text.includes("서울") || text.includes("부산")) {
        setTravelInfo((prev) => ({ ...prev, destination: text }));

        try {
          const searchResults = await searchDestinations(text);
          return {
            id: Date.now().toString(),
            text: "입력하신 지역의 추천 여행지입니다:",
            isBot: true,
            timestamp: new Date().toISOString(),
            searchResults,
            options: [
              { text: "📝 일정 수정하기", value: "modify" },
              { text: "📍 이동 경로 추천받기", value: "route" },
              { text: "✅ 그대로 진행하기", value: "confirm" },
            ],
          };
        } catch (error) {
          console.error("Search error:", error);
          return {
            id: Date.now().toString(),
            text: "죄송합니다. 여행지 검색 중 오류가 발생했습니다.",
            isBot: true,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // 인원 수 입력 감지
      if (text.match(/\d+명/)) {
        const people = parseInt(text.match(/\d+/)?.[0] || "0");
        setTravelInfo((prev) => ({ ...prev, people }));
        return {
          id: Date.now().toString(),
          text: `${people}명이 함께 여행하시는군요! 동반자 유형을 알려주세요.`,
          isBot: true,
          timestamp: new Date().toISOString(),
          options: [
            { text: "👨‍👩‍👧‍👦 가족", value: "family" },
            { text: "👥 친구", value: "friends" },
            { text: "💑 연인", value: "couple" },
            { text: "🧑 혼자", value: "solo" },
          ],
        };
      }

      // 기본 응답
      return {
        id: Date.now().toString(),
        text: "네, 알겠습니다. 다음 정보도 알려주세요.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Bot response error:", error);
      return {
        id: Date.now().toString(),
        text: "죄송합니다. 처리 중 오류가 발생했습니다.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
    }
  };

  const sendMessage = async (text: string) => {
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        isBot: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const botResponse = await handleBotResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        isBot: true,
        timestamp: new Date().toISOString(),
        options: botResponse.options,
        questions: botResponse.questions,
        searchResults: botResponse.searchResults,
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

  const handleOptionSelect = async (option: string) => {
    // 먼저 사용자가 선택한 옵션을 메시지로 표시
    const userMessage: Message = {
      id: Date.now().toString(),
      text: option,
      isBot: false,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      let botResponse: Message;

      switch (option) {
        case "1": // 직접 일정 입력
          botResponse = {
            id: Date.now().toString(),
            text: "여행 일정을 등록하기 위해 아래 정보를 알려주세요:",
            isBot: true,
            timestamp: new Date().toISOString(),
            questions: [
              "1. 여행지는 어디인가요?",
              "2. 여행 기간은 언제인가요?",
              "3. 몇 명이 함께 여행하시나요?",
              "4. 동반자(가족, 친구 등)가 있나요?",
              "5. 주요 활동 계획을 알려주세요",
              "6. 예상 예산을 알려주세요",
            ],
          };
          break;

        case "2": // AI 추천
          botResponse = {
            id: Date.now().toString(),
            text: "맞춤형 여행 계획을 추천해드리겠습니다. 아래 정보를 알려주세요:",
            isBot: true,
            timestamp: new Date().toISOString(),
            questions: [
              "1. 희망하는 여행지가 있나요?",
              "2. 언제 여행을 가고 싶으신가요?",
              "3. 몇 명이 함께 여행하시나요?",
              "4. 동반자(가족, 친구 등)가 있나요?",
              "5. 선호하는 활동이 있나요? (예: 관광, 맛집, 쇼핑 등)",
              "6. 예산은 어느 정도로 생각하시나요?",
            ],
          };
          break;

        case "family":
        case "friends":
        case "couple":
        case "solo":
          setTravelInfo((prev) => ({ ...prev, companions: option }));
          botResponse = {
            id: Date.now().toString(),
            text: "선호하는 활동을 선택해주세요:",
            isBot: true,
            timestamp: new Date().toISOString(),
            options: [
              { text: "🏛 관광", value: "관광" },
              { text: "🍽 맛집", value: "맛집" },
              { text: "🛍 쇼핑", value: "쇼핑" },
            ],
          };
          break;

        case "confirm":
          try {
            const schedule = await generateSchedule(travelInfo);
            navigation.navigate("Schedule", { schedule });
            return; // 네비게이션 후 추가 메시지 불필요
          } catch (error) {
            console.error("Schedule generation error:", error);
            botResponse = {
              id: Date.now().toString(),
              text: "죄송합니다. 일정 생성에 실패했습니다.",
              isBot: true,
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "modify":
          navigation.navigate("ScheduleEdit", { travelInfo });
          return; // 네비게이션 후 추가 메시지 불필요

        case "route":
          botResponse = {
            id: Date.now().toString(),
            text: "추천 이동 경로입니다:",
            isBot: true,
            timestamp: new Date().toISOString(),
            options: [
              { text: "🚕 택시 (15분, 약 12,000원)", value: "taxi" },
              { text: "🚌 버스 1번 + 지하철 (24분)", value: "public" },
              { text: "🚶 도보 (50분)", value: "walk" },
            ],
          };
          break;

        default:
          botResponse = {
            id: Date.now().toString(),
            text: "네, 알겠습니다. 다음 단계를 진행해주세요.",
            isBot: true,
            timestamp: new Date().toISOString(),
          };
      }

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Option selection error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "죄송합니다. 처리 중 오류가 발생했습니다.",
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        enabled
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#000" />
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

        <View style={styles.messageListContainer}>
          <MessageList
            messages={messages}
            onOptionSelect={handleOptionSelect}
            toggleModal={toggleModal}
          />
        </View>

        <View style={styles.inputContainer}>
          <MessageInput
            onSend={sendMessage}
            onVoiceStart={toggleVoiceRecognition}
            isListening={isListening}
          />
        </View>

        <OptionModal isVisible={isModalVisible} onClose={toggleModal} />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  voiceBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F2F2F7",
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  voiceIcon: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceWave: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  voiceWaveActive: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  voiceText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  messageListContainer: {
    flex: 1,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
});
