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
  const [displayedText, setDisplayedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isAudioReady, setIsAudioReady] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const recognizer = useRef<sdk.SpeechRecognizer | null>(null);
  const synthesizer = useRef<sdk.SpeechSynthesizer | null>(null);
  const { processQuery, isProcessing } = useAzureBot();

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
          allowsRecordingIOS: true,
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

  // Azure STT(Speech-to-Text) 함수 수정
  const startAzureSTT = async () => {
    try {
      // 1. 마이크 권한 확인
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Microphone permission not granted");
      }

      // 2. Audio 세션 설정 - 숫자로 직접 지정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // iOS: 1=MixWithOthers, 2=DuckOthers, 3=DoNotMix
        interruptionModeIOS: 2,
        shouldDuckAndroid: true,
        // Android: 1=DuckOthers, 2=DoNotMix
        interruptionModeAndroid: 2,
        playThroughEarpieceAndroid: false,
      });

      // 3. Azure Speech 설정
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        "9ot6vDP41TrM6i1MRWbtsyZrOFlXDy4UunpzMcZbT5QrzyLvEHDYJQQJ99BAACYeBjFXJ3w3AAAYACOGvVzj",
        "eastus"
      );
      speechConfig.speechRecognitionLanguage = "ko-KR";

      // 4. 마이크 설정
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

      // 5. 인식기 생성 및 설정
      recognizer.current = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      // 6. 음성 인식 실행
      return new Promise((resolve, reject) => {
        if (!recognizer.current) {
          reject(new Error("Recognizer not initialized"));
          return;
        }

        recognizer.current.recognizing = (s, e) => {
          console.log(`RECOGNIZING: Text=${e.result.text}`);
          setUserInput(e.result.text);
        };

        recognizer.current.recognized = (s, e) => {
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            console.log(`RECOGNIZED: Text=${e.result.text}`);
          } else {
            console.log(
              `ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.`
            );
          }
        };

        recognizer.current.canceled = (s, e) => {
          console.log(`CANCELED: Reason=${e.reason}`);
          reject(new Error("Speech recognition canceled"));
        };

        recognizer.current.sessionStarted = (s, e) => {
          console.log("\nSession started event.");
        };

        recognizer.current.sessionStopped = (s, e) => {
          console.log("\nSession stopped event.");
        };

        // 한 번의 발화 인식
        recognizer.current.recognizeOnceAsync(
          (result) => {
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve(result.text);
            } else {
              reject(new Error("Failed to recognize speech"));
            }
            recognizer.current?.close();
          },
          (error) => {
            console.error("Recognition error:", error);
            reject(error);
            recognizer.current?.close();
          }
        );
      });
    } catch (error) {
      console.error("STT initialization failed:", error);
      throw error;
    }
  };

  // 마이크 버튼 핸들러 수정
  const handleMicPress = async () => {
    try {
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

      // 3. 답변 표시 및 음성 출력
      setDisplayedText(response.text);
      setUserInput("");
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
        <Text style={styles.mainText}>{displayedText}</Text>
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
