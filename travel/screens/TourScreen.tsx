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
import { ChevronLeft, Mic, ArrowLeft, Map } from "lucide-react-native";
import MapIcon from "../assets/map.svg";
import * as Speech from "expo-speech";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import "react-native-get-random-values";
import { useAzureBot } from "../src/hooks/useAzureBot";
import { useNavigation } from "@react-navigation/native";
// import * as azureSpeech from "microsoft-cognitiveservices-speech-sdk";
import { LinearGradient } from "expo-linear-gradient";
import BackToStoryIcon from "../assets/backtostory.svg";
import { AudioService } from "../services/audioService";
import MicIcon from "../assets/mic.svg";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";

type TourScreenProps = {
  navigation: any;
};

// 하드코딩된 키 사용 (임시)
const SPEECH_KEY =
  "9ot6vDP41TrM6i1MRWbtsyZrOFlXDy4UunpzMcZbT5QrzyLvEHDYJQQJ99BAACYeBjFXJ3w3AAAYACOGvVzj";
const SPEECH_REGION = "eastus";

const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

type Interest = "건축" | "역사" | "문화" | "요리" | "자연";

export default function TourScreen() {
  const navigation = useNavigation();
  const [displayedText, setDisplayedText] = useState("");
  const [fullText, setFullText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isAudioReady, setIsAudioReady] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const recognizer = useRef<sdk.SpeechRecognizer | null>(null);
  const { processQuery, isProcessing } = useAzureBot();
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(
    null
  );
  const [tourGuide, setTourGuide] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const characterDelay = 50; // 글자당 50ms 딜레이
  const audioService = useRef(new AudioService());
  const rotation = useSharedValue(0);

  const interests: Interest[] = ["건축", "역사", "문화", "요리", "자연"];

  // 텍스트를 점진적으로 표시하는 함수
  const animateText = (text: string) => {
    let currentIndex = 0;
    setDisplayedText("");
    setFullText(text);

    const showNextCharacter = () => {
      if (currentIndex < text.length) {
        setTourGuide((prev) => prev + text[currentIndex]);
        currentIndex++;
        textTimeoutRef.current = setTimeout(showNextCharacter, characterDelay);
      }
    };

    showNextCharacter();
  };

  // Azure Speech 관련 함수 수정
  const startSpeaking = async (text: string) => {
    try {
      console.log("Starting Azure TTS with text:", text);

      // 기존 synthesizer가 있다면 정리
      // if (synthesizer.current) {
      //   synthesizer.current.close();
      // }

      // Azure Speech 설정
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        SPEECH_KEY,
        SPEECH_REGION
      );
      speechConfig.speechSynthesisVoiceName = "ko-KR-HyunsuMultilingualNeural";

      // 오디오 출력 설정
      // const audioConfig = azureSpeech.AudioConfig.fromDefaultSpeakerOutput();
      // synthesizer.current = new azureSpeech.SpeechSynthesizer(
      //   speechConfig,
      //   audioConfig
      // );

      return new Promise((resolve, reject) => {
        // if (!synthesizer.current) {
        //   reject(new Error("Synthesizer not initialized"));
        //   return;
        // }
        // synthesizer.current!.speakTextAsync(
        //   text,
        //   (result) => {
        //     if (
        //       result.reason ===
        //       azureSpeech.ResultReason.SynthesizingAudioCompleted
        //     ) {
        //       console.log("Azure TTS completed successfully");
        //       resolve(result);
        //     } else {
        //       console.error("Azure TTS failed:", result.errorDetails);
        //       reject(new Error(result.errorDetails));
        //     }
        //     synthesizer.current?.close();
        //   },
        //   (error) => {
        //     console.error("Azure TTS error:", error);
        //     synthesizer.current?.close();
        //     reject(error);
        //   }
        // );
      });
    } catch (error) {
      console.error("Azure TTS setup error:", error);
      throw error;
    }
  };

  // Audio 권한 관리를 위한 초기 설정
  useEffect(() => {
    // const initializeAudioPermission = async () => {
    //   try {
    //     const { granted } = await Speech.requestPermissionsAsync();
    //     if (!granted) {
    //       console.error("Audio permission is required");
    //       return;
    //     }
    //     await Speech.setAudioModeAsync({
    //       playsInSilentModeIOS: true,
    //       allowsRecordingIOS: true,
    //       interruptionModeIOS: 2,
    //       interruptionModeAndroid: 1,
    //       shouldDuckAndroid: true,
    //       playThroughEarpieceAndroid: false,
    //     });
    //     setIsAudioReady(true);
    //   } catch (error) {
    //     console.error("Failed to initialize audio:", error);
    //   }
    // };
    // initializeAudioPermission();
  }, []);

  // Azure STT(Speech-to-Text) 함수 수정
  const startAzureSTT = async () => {
    try {
      // 1. 마이크 권한 확인
      const permission = await Speech.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Microphone permission not granted");
      }

      // 2. Audio 세션 설정 - 숫자로 직접 지정
      await Speech.setAudioModeAsync({
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
        SPEECH_KEY,
        SPEECH_REGION
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
  const handleMicPress = () => {
    setIsRecording(!isRecording);
  };

  const handleMapPress = () => {
    navigation.navigate("Map");
  };

  const generateTourGuide = async (location: string, interest: Interest) => {
    setIsLoading(true);
    try {
      const messages = [
        {
          role: "system",
          content: `당신은 전문 도슨트입니다. ${interest} 분야에 관심이 많은 관광객을 위해 ${location}에 대한 전문적이고 흥미로운 설명을 제공해주세요.
          
          특히 ${interest}와 관련된 내용을 상세히 다루되, 다음 사항을 포함해주세요:
          - ${interest} 관점에서 본 ${location}만의 특별한 점
          - 관련된 전문적인 용어와 설명
          - 일반 관광 가이드에서는 접할 수 없는 심층적인 정보
          - ${interest} 애호가들이 특히 관심을 가질 만한 세부사항`,
        },
        {
          role: "user",
          content: `${location}에 대해 설명해주세요. 나는 ${interest}에 관심이 많습니다.`,
        },
      ];

      const response = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_KEY,
          },
          body: JSON.stringify({
            messages,
            max_tokens: 2000,
            temperature: 0.7,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate tour guide");
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // 텍스트를 바로 설정하지 않고 animateText 함수 호출
      setTourGuide(""); // 초기화
      animateText(content);
    } catch (error) {
      console.error("Error generating tour guide:", error);
      setTourGuide("죄송합니다. 설명을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // speakText 함수 수정
  const speakText = (text: string) => {
    setIsSpeaking(!isSpeaking);
    // TODO: 실제 음성 기능 구현 시 audioService 연동
  };

  // 음성 및 텍스트 표시 중지
  const stopSpeaking = () => {
    // if (synthesizer.current) {
    //   synthesizer.current.close();
    //   setIsSpeaking(false);
    //
    //   // 애니메이션 중지 및 전체 텍스트 표시
    //   if (textTimeoutRef.current) {
    //     clearTimeout(textTimeoutRef.current);
    //   }
    //   setDisplayedText(fullText);
    // }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
      }
      // if (synthesizer.current) {
      //   synthesizer.current.close();
      // }
    };
  }, []);

  useEffect(() => {
    // 오디오 서비스 초기화
    audioService.current.initialize();

    return () => {
      audioService.current.cleanup();
    };
  }, []);

  // 녹음 시작시 애니메이션 시작
  useEffect(() => {
    if (isRecording) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 3000, // 3초에 한바퀴 (더 천천히)
        }),
        -1, // 무한 반복
        false // 역방향 없음
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 }); // 부드럽게 멈춤
    }
  }, [isRecording]);

  // 회전 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

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
      <LinearGradient
        colors={["#4E7EB8", "#89BBEC", "#9AADC4"]}
        style={styles.gradient}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: "#fff" }]}>여행 도슨트</Text>
        <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
          <Map size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.interestsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {interests.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.interestButton,
                selectedInterest === interest && styles.selectedInterest,
              ]}
              onPress={() => {
                setSelectedInterest(interest);
                generateTourGuide("경복궁", interest);
              }}
            >
              <Text
                style={[
                  styles.interestText,
                  selectedInterest === interest && styles.selectedInterestText,
                ]}
              >
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.guideContainer}
        contentContainerStyle={styles.guideContent}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : tourGuide ? (
          <View style={styles.textContainer}>
            <Text style={styles.guideText}>{tourGuide}</Text>
          </View>
        ) : (
          <Text style={styles.guideText}>
            관심사를 선택하시면 맞춤형 설명을 들려드립니다.
          </Text>
        )}
      </ScrollView>

      {/* 음성 시각화 및 텍스트 영역 */}
      <View style={styles.voiceVisualizerContainer}>
        {isRecording && (
          <Text style={styles.listeningText}>듣고 있습니다...</Text>
        )}
        {/* 나중에 여기에 voice wave 컴포넌트가 들어갈 예정 */}
      </View>

      <View style={styles.footer}>
        <View style={styles.tabBar}>
          <View style={styles.actions}>
            {/* 왼쪽 버튼 (임시) */}
            <TouchableOpacity style={styles.squareButton}>
              <View style={styles.square} />
            </TouchableOpacity>

            {/* 중앙 마이크 버튼 */}
            <View style={styles.micButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonActive,
                ]}
                onPress={handleMicPress}
              >
                {isRecording ? (
                  <>
                    {/* 바깥쪽 원 (고정) */}
                    <View style={styles.micButtonBorderOuter} />
                    {/* 안쪽 원 (회전) */}
                    <Animated.View
                      style={[styles.micButtonBorderInner, animatedStyle]}
                    />
                    <View style={styles.stopIconNew} />
                  </>
                ) : (
                  <MicIcon width={24} height={24} style={styles.micIcon} />
                )}
              </TouchableOpacity>
            </View>

            {/* 오른쪽 버튼 - 녹음 중일 때만 표시 */}
            <View style={styles.rightButtonContainer}>
              {isRecording ? (
                <TouchableOpacity
                  style={styles.backToStoryButton}
                  onPress={() => {
                    /* 뒤로가기 처리 */
                  }}
                >
                  <BackToStoryIcon width={54} height={18} />
                </TouchableOpacity>
              ) : (
                <View style={styles.emptySpace} />
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 8,
  },
  mapButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  interestsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  interestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginHorizontal: 6,
  },
  selectedInterest: {
    backgroundColor: "#007AFF",
  },
  interestText: {
    color: "#007AFF",
    fontSize: 16,
  },
  selectedInterestText: {
    color: "#fff",
  },
  guideContainer: {
    flex: 1,
    marginBottom: 120, // 하단 버튼들을 가리지 않도록
  },
  guideContent: {
    padding: 20,
  },
  textContainer: {
    width: 319,
    minHeight: 378,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
  },
  guideText: {
    fontFamily: Platform.OS === "ios" ? "Inter" : "normal",
    fontSize: 32,
    lineHeight: 42,
    color: "#FFFFFF",
    letterSpacing: -0.3,
    alignSelf: "stretch",
    flexGrow: 0,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  voiceVisualizerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 140, // tabBar 위쪽에 위치
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  listeningText: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 106,
    paddingTop: 8,
    alignItems: "center",
  },
  actions: {
    width: 375,
    height: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 0,
    isolation: "isolate",
    alignSelf: "stretch",
  },
  micButtonContainer: {
    width: 64,
    height: 64,
    position: "relative",
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  micButtonBorderOuter: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5.33,
    borderColor: "#FFFFFF",
    opacity: 0.5,
  },
  micButtonBorderInner: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5.33,
    borderColor: "#FFFFFF",
  },
  stopIconNew: {
    position: "absolute",
    width: 25.14,
    height: 25.14,
    left: 19.43,
    top: 19.43,
    backgroundColor: "#FFFFFF",
    borderRadius: 7.11,
  },
  micIcon: {
    position: "absolute",
    left: "31%",
    top: "31%",
  },
  micButtonActive: {
    backgroundColor: "transparent",
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
  speakButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backToStoryButton: {
    width: 54,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  speakButtonIcon: {
    color: "#fff",
    fontSize: 16,
  },
  squareButton: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  square: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 8,
  },
  playButton: {
    width: 54,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonText: {
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "normal",
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  rightButtonContainer: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySpace: {
    width: 64,
    height: 64,
  },
});
