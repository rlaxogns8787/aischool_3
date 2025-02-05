import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Mic } from "lucide-react-native";
import MapIcon from "../assets/map.svg";
import * as Speech from "expo-speech";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { Audio } from "expo-av";
import "react-native-get-random-values";
import { useAzureBot } from "../src/hooks/useAzureBot";

type TourScreenProps = {
  navigation: any;
};

export default function TourScreen({ navigation }: TourScreenProps) {
  const [fullText] = useState(
    "경복궁은 대한민국의 수도 서울에 위치한 궁전으로 '큰 복을 누리며 번성하라' 라는 뜻을 지니고 있습니다. 면적은 약 43만 제곱미터로 축구장 60개 정도의 크기입니다..."
  );
  const [displayedText, setDisplayedText] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isAudioReady, setIsAudioReady] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const recognizer = useRef<sdk.SpeechRecognizer | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const { processQuery, isProcessing } = useAzureBot();
  const synthesizer = useRef<sdk.SpeechSynthesizer | null>(null);

  // Azure Speech 관련 함수 수정
  const startSpeaking = async (text: string) => {
    try {
      console.log("Starting Azure TTS with text:", text);

      // 기존 synthesizer가 있다면 정리
      if (synthesizer.current) {
        synthesizer.current.close();
      }

      // Azure Speech 설정
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        "9ot6vDP41TrM6i1MRWbtsyZrOFlXDy4UunpzMcZbT5QrzyLvEHDYJQQJ99BAACYeBjFXJ3w3AAAYACOGvVzj",
        "eastus"
      );
      speechConfig.speechSynthesisVoiceName = "ko-KR-SunHiNeural";

      // 오디오 출력 설정
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      synthesizer.current = new sdk.SpeechSynthesizer(
        speechConfig,
        audioConfig
      );

      return new Promise((resolve, reject) => {
        synthesizer.current!.speakTextAsync(
          text,
          (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log("Azure TTS completed successfully");
              resolve(result);
            } else {
              console.error("Azure TTS failed:", result.errorDetails);
              reject(new Error(result.errorDetails));
            }
            synthesizer.current?.close();
          },
          (error) => {
            console.error("Azure TTS error:", error);
            synthesizer.current?.close();
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error("Azure TTS setup error:", error);
      throw error;
    }
  };

  // Audio 권한 관리를 위한 초기 설정
  useEffect(() => {
    const initializeAudioPermission = async () => {
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          console.error("Audio permission is required");
          return;
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: true, // 마이크 사용을 위해 true로 변경
          interruptionModeIOS: 2,
          interruptionModeAndroid: 1,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        setIsAudioReady(true);
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initializeAudioPermission();
  }, []);

  // 초기 텍스트 출력 useEffect 수정
  useEffect(() => {
    let isMounted = true;
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const animateText = () => {
      if (!isMounted) return;
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
        timeoutId = setTimeout(animateText, 50);
      }
    };

    const initializeAudio = async () => {
      if (isAudioReady && isMounted) {
        try {
          console.log("Starting initial text animation and speech");
          animateText();

          // 약간의 지연 후 음성 시작
          setTimeout(async () => {
            if (isMounted) {
              console.log("Starting speech after delay");
              await startSpeaking(fullText);
            }
          }, 1000);
        } catch (error) {
          console.error("Initial TTS error:", error);
        }
      }
    };

    initializeAudio();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      Speech.stop();
    };
  }, [isAudioReady, fullText]);

  // Azure STT(Speech-to-Text) 함수
  const startAzureSTT = async () => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        "9ot6vDP41TrM6i1MRWbtsyZrOFlXDy4UunpzMcZbT5QrzyLvEHDYJQQJ99BAACYeBjFXJ3w3AAAYACOGvVzj",
        "eastus"
      );
      speechConfig.speechRecognitionLanguage = "ko-KR";

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      return new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve(result.text);
            } else {
              reject(new Error("Failed to recognize speech"));
            }
            recognizer.close();
          },
          (error) => {
            reject(error);
            recognizer.close();
          }
        );
      });
    } catch (error) {
      throw new Error("STT initialization failed");
    }
  };

  // 마이크 버튼 핸들러 수정
  const handleMicPress = async () => {
    try {
      // 현재 재생 중인 음성 중지
      if (synthesizer.current) {
        synthesizer.current.close();
      }

      setIsRecording(true);
      setUserInput("듣고 있습니다...");

      // 1. 음성 인식 시작
      const recognizedText = await startAzureSTT();
      console.log("인식된 텍스트:", recognizedText);
      setUserInput(recognizedText);

      // 2. AI 검색 및 답변 생성
      const response = await processQuery(recognizedText);
      console.log("AI 답변:", response.text);
      setUserInput(response.text);

      // 3. 답변 음성 출력
      await startSpeaking(response.text);

      // 4. 지도 정보가 있다면 지도 화면으로 이동
      if (response.additionalData?.coordinates) {
        navigation.navigate("Map", {
          coordinates: response.additionalData.coordinates,
        });
      }
    } catch (error) {
      console.error("Voice interaction failed:", error);
      setUserInput("죄송합니다. 다시 말씀해 주세요.");
    } finally {
      setIsRecording(false);
    }
  };

  const handleMapPress = () => {
    navigation.navigate("Map");
  };

  if (!isAudioReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>음성 서비스 초기화 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMapPress}>
          <MapIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.mainText}>
          {displayedText.split("").map((char, index) => (
            <Text
              key={index}
              style={[
                styles.char,
                index < highlightIndex && styles.highlightedChar,
              ]}
            >
              {char}
            </Text>
          ))}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        {userInput ? (
          <Text style={styles.recordingStatus}>{userInput}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonActive]}
          onPress={handleMicPress}
        >
          <Mic color={isRecording ? "#fff" : "#007AFF"} size={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  mainText: {
    fontSize: 24,
    lineHeight: 39,
    fontFamily: "System",
  },
  char: {
    color: "rgba(67, 77, 86, 0.5)",
    fontWeight: "400",
  },
  highlightedChar: {
    color: "rgb(67, 77, 86)",
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  micButtonActive: {
    backgroundColor: "#007AFF",
  },
  userInput: {
    fontSize: 18,
    color: "#007AFF",
    marginBottom: 20,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 20,
    color: "#666",
  },
  recordingStatus: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
