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
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  inputType?: "text" | "selection" | "date" | "number";
  expectedAnswer?: {
    type:
      | "previousExperience"
      | "destination"
      | "dates"
      | "people"
      | "companions"
      | "guideNeeded"
      | "budget"
      | "travelStyle"
      | "transportation"
      | "additionalRequests";
    options?: string[];
  };
};

type TravelInfo = {
  previousExperience?: string;
  destination?: string;
  dates?: {
    start: string;
    end: string;
  };
  people?: number;
  companions?: "solo" | "family" | "friends" | "couple";
  guideNeeded?: boolean;
  budget?: number;
  travelStyle?: string[];
  transportationType?: string[];
  additionalRequests?: string;
  analyzedPreferences?: any;
};

// 질문 순서 정의
const QUESTION_SEQUENCE = {
  PREVIOUS_EXPERIENCE: "previousExperience",
  TRAVEL_STYLE: "travelStyle",
  DESTINATION: "destination",
  START_DATE: "startDate",
  DURATION: "duration",
  PEOPLE_COUNT: "peopleCount",
  COMPANIONS: "companions",
  GUIDE_NEEDED: "guideNeeded",
  BUDGET: "budget",
  TRANSPORTATION: "transportation",
} as const;

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

  const { searchDestinations, generateSchedule, analyzeExperience } =
    useAzureServices();

  // AsyncStorage 키
  const STORAGE_KEY = "travel_info";

  // 저장된 데이터 불러오기
  useEffect(() => {
    const loadTravelInfo = async () => {
      try {
        const savedInfo = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedInfo) {
          setTravelInfo(JSON.parse(savedInfo));
        }
      } catch (error) {
        console.error("Error loading travel info:", error);
      }
    };
    loadTravelInfo();
  }, []);

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

  const sendMessage = async (text: string) => {
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        isBot: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      await handleUserInput(text, "initial");
    } catch (error) {
      console.error("Error processing message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "죄송합니다. 처리 중 오류가 발생했습니다.",
          isBot: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleUserInput = async (input: string, type: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      let nextQuestion: Message | null = null;

      // 첫 번째 선택 처리
      if (type === "initial") {
        const isFirstOption =
          input === "1" ||
          input === "1번" ||
          input === "hasplan" ||
          input.includes("생각한") ||
          input.includes("있어요");

        const isSecondOption =
          input === "2" ||
          input === "2번" ||
          input === "needhelp" ||
          input.includes("처음부터") ||
          input.includes("도와주세요");

        if (isFirstOption || isSecondOption) {
          nextQuestion = {
            id: Date.now().toString(),
            text: "어떤 스타일의 여행을 선호하시나요?",
            isBot: true,
            timestamp: new Date().toISOString(),
            options: [
              { text: "✨ 자연/풍경", value: "nature" },
              { text: "🏛 문화/역사", value: "culture" },
              { text: "🍽 맛집/음식", value: "food" },
              { text: "🎢 액티비티", value: "activity" },
              { text: "😌 힐링/휴양", value: "healing" },
            ],
            expectedAnswer: { type: "travelStyle" },
          };
        }
      } else {
        switch (type) {
          case "travelStyle":
            setTravelInfo((prev) => ({
              ...prev,
              travelStyle: [input],
            }));
            nextQuestion = {
              id: Date.now().toString(),
              text: "어디로 여행을 계획하시나요?",
              isBot: true,
              timestamp: new Date().toISOString(),
              inputType: "text",
              expectedAnswer: { type: "destination" },
            };
            break;

          case "destination":
            setTravelInfo((prev) => ({
              ...prev,
              destination: input,
            }));
            nextQuestion = {
              id: Date.now().toString(),
              text: "언제부터 여행을 시작하고 싶으신가요?",
              isBot: true,
              timestamp: new Date().toISOString(),
              inputType: "date",
              expectedAnswer: { type: "startDate" },
            };
            break;

          case "startDate":
            setTravelInfo((prev) => ({
              ...prev,
              dates: { ...prev.dates, start: input },
            }));
            nextQuestion = {
              id: Date.now().toString(),
              text: "여행 기간은 얼마나 계획하시나요? (예: 2박3일)",
              isBot: true,
              timestamp: new Date().toISOString(),
              inputType: "text",
              expectedAnswer: { type: "duration" },
            };
            break;

          case "duration":
            setTravelInfo((prev) => ({
              ...prev,
              dates: {
                ...prev.dates,
                end: calculateEndDate(prev.dates?.start || "", input),
              },
            }));
            nextQuestion = {
              id: Date.now().toString(),
              text: "몇 명이서 여행하실 예정인가요?",
              isBot: true,
              timestamp: new Date().toISOString(),
              inputType: "number",
              expectedAnswer: { type: "people" },
            };
            break;

          case "people":
            setTravelInfo((prev) => ({
              ...prev,
              people: parseInt(input),
            }));
            nextQuestion = {
              id: Date.now().toString(),
              text: "누구와 함께 여행하시나요?",
              isBot: true,
              timestamp: new Date().toISOString(),
              options: [
                { text: "👨‍👩‍👧‍👦 가족", value: "family" },
                { text: "👥 친구", value: "friends" },
                { text: "💑 연인", value: "couple" },
                { text: "🧑 혼자", value: "solo" },
              ],
            };
            break;

          case "companions":
            setTravelInfo((prev) => ({
              ...prev,
              companions: input as TravelInfo["companions"],
            }));
            // 혼자가 아닐 경우에만 가이드 필요 여부 질문
            nextQuestion =
              input === "solo"
                ? {
                    id: Date.now().toString(),
                    text: "예산은 어느 정도로 생각하시나요?",
                    isBot: true,
                    timestamp: new Date().toISOString(),
                    inputType: "number",
                    expectedAnswer: { type: "budget" },
                  }
                : {
                    id: Date.now().toString(),
                    text: "도슨트/가이드 서비스가 필요하신가요?",
                    isBot: true,
                    timestamp: new Date().toISOString(),
                    options: [
                      { text: "✅ 예", value: "true" },
                      { text: "❌ 아니오", value: "false" },
                    ],
                    expectedAnswer: { type: "guideNeeded" },
                  };
            break;

          case "guideNeeded":
            setTravelInfo((prev) => ({
              ...prev,
              guideNeeded: input === "true",
            }));
            nextQuestion = {
              id: Date.now().toString(),
              text: "예산은 어느 정도로 생각하시나요?",
              isBot: true,
              timestamp: new Date().toISOString(),
              inputType: "number",
              expectedAnswer: { type: "budget" },
            };
            break;

          case "budget":
            setTravelInfo((prev) => ({
              ...prev,
              budget: parseInt(input),
            }));
            nextQuestion = getNextQuestion(QUESTION_SEQUENCE.TRANSPORTATION);
            break;

          case "transportation":
            setTravelInfo((prev) => ({
              ...prev,
              transportationType: [input],
            }));
            // 모든 정보가 수집되면 일정 생성
            const schedule = await generateSchedule(travelInfo);
            navigation.navigate("Schedule", { schedule });
            return;

          default:
            const nextStep = getNextQuestionType(type);
            nextQuestion = getNextQuestion(nextStep);
        }
      }

      if (nextQuestion) {
        setTimeout(() => {
          setMessages((prev) => [...prev, nextQuestion!]);
        }, 500);
      }
    } catch (error) {
      console.error("Input handling error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "죄송합니다. 처리 중 오류가 발생했습니다.",
          isBot: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  // 다음 질문 타입 결정
  const getNextQuestionType = (currentType: string): string => {
    const sequence = Object.values(QUESTION_SEQUENCE);
    const currentIndex = sequence.indexOf(currentType);
    return sequence[currentIndex + 1] || sequence[0];
  };

  // 초기 메시지 설정
  useEffect(() => {
    setMessages([
      {
        id: "1",
        text: "먼저 진행하기전에 아래 두 옵션 중 하나를 선택을 해주세요:",
        isBot: true,
        timestamp: new Date().toISOString(),
        options: [
          { text: "1. 저는 이미 생각한 여행일정 있어요.", value: "hasplan" },
          {
            text: "2. 여행은 가고싶지만 처음부터 도와주세요.",
            value: "needhelp",
          },
        ],
        expectedAnswer: { type: "initial" },
      },
    ]);
  }, []);

  // 여행 기간 계산 헬퍼 함수
  const calculateEndDate = (startDate: string, duration: string): string => {
    const start = new Date(startDate);
    const nights = parseInt(duration.match(/\d+/)?.[0] || "0");
    const end = new Date(start);
    end.setDate(end.getDate() + nights);
    return end.toISOString();
  };

  // 디버깅을 위한 useEffect 수정
  useEffect(() => {
    console.log("TravelInfo updated:", travelInfo);
    // 상태가 변경될 때마다 저장
    if (Object.keys(travelInfo).length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(travelInfo)).catch(
        (error) => console.error("Error saving travel info:", error)
      );
    }
  }, [travelInfo]);

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
            onOptionSelect={handleUserInput}
            toggleModal={toggleModal}
          />
        </View>

        <View style={styles.inputContainer}>
          <MessageInput
            onSend={handleUserInput}
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
