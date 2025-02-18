import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Mic, ArrowLeft, Map } from "lucide-react-native";
import MapIcon from "../assets/map.svg";
import * as Speech from "expo-speech";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import "react-native-get-random-values";
import { useAzureBot } from "../src/hooks/useAzureBot";
import { useNavigation } from "@react-navigation/native";
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
import * as Location from "expo-location";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { encode as btoa } from "base-64";

type TourScreenProps = {
  navigation: any;
};

// Azure Speech Services 키와 리전 설정
const SPEECH_KEY =
  "9ot6vDP41TrM6i1MRWbtsyZrOFlXDy4UunpzMcZbT5QrzyLvEHDYJQQJ99BAACYeBjFXJ3w3AAAYACOGvVzj";
const SPEECH_REGION = "eastus";

const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

// 샘플 일정 타입 정의 (경복궁 관련 내용 그대로 유지)
interface SpotInfo {
  name: string;
  coords: {
    latitude: number;
    longitude: number;
  };
  description?: string;
}

// 음성 타입 정의 (기존 그대로)
interface VoiceType {
  name: string;
  id: string;
  description: string;
  disabled?: boolean;
}

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
  const [tourGuide, setTourGuide] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const characterDelay = 50;
  const audioService = useRef(new AudioService());
  const rotation = useSharedValue(0);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [isGuiding, setIsGuiding] = useState(false);
  const [pausedGuideText, setPausedGuideText] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>({
    name: "선희",
    id: "ko-KR-SunHiNeural",
    description: "차분하고 전문적인 성우 음성",
  });

  // 사용자 관심사를 "요리"로 고정
  const userInterest = "요리";

  // 샘플 일정 데이터 (경복궁 관련 내용 그대로 유지)
  const sampleSchedule: SpotInfo[] = [
    {
      name: "경복궁",
      coords: { latitude: 37.579617, longitude: 126.977041 },
      description: "조선왕조의 법궁, 수랏간과 다양한 궁중 음식 문화의 중심지",
    },
  ];

  // 사용 가능한 음성 목록 (기존 그대로)
  const voiceTypes: VoiceType[] = [
    {
      name: "선희",
      id: "ko-KR-SunHiNeural",
      description: "차분하고 전문적인 성우 음성",
    },
    {
      name: "지민",
      id: "ko-KR-JiMinNeural",
      description: "밝고 친근한 청년 음성",
    },
    {
      name: "진수",
      id: "ko-KR-InJoonNeural",
      description: "부드럽고 차분한 남성 음성",
      disabled: true,
    },
  ];

  // 음성 선택 핸들러 (기존 그대로)
  const handleVoiceSelect = async (voice: VoiceType) => {
    console.log("handleVoiceSelect 시작:", voice);
    try {
      setIsLoading(true);
      if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
      setSelectedVoice(voice);
      setShowVoiceModal(false);
      if (currentLocation) {
        const nearbySpot = findNearbySpot(currentLocation.coords);
        if (nearbySpot) {
          setTourGuide("");
          const guideText = await generateTourGuide(
            nearbySpot.name,
            userInterest
          );
          console.log("guideText 생성 완료:", guideText);
          if (guideText !== "설명 생성 실패") {
            setIsGuiding(true);
            await startSpeaking(guideText);
          }
        }
      }
    } catch (error) {
      console.error("Voice selection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // animateText 함수 (텍스트를 점진적으로 표시)
  const animateText = (text: string) => {
    console.log("animateText 시작:", text);
    if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
    let currentIndex = 0;
    setTourGuide(""); // 기존 텍스트 초기화
    const showNextCharacter = () => {
      if (currentIndex < text.length) {
        setTourGuide((prev) => prev + text[currentIndex]);
        currentIndex++;
        textTimeoutRef.current = setTimeout(showNextCharacter, characterDelay);
      } else {
        console.log("animateText 완료");
      }
    };
    showNextCharacter();
  };

  // 오디오 초기화 (expo-av)
  useEffect(() => {
    const initializeAudio = async () => {
      console.log("오디오 초기화 시작");
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("오류", "오디오 권한이 필요합니다.");
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("오디오 초기화 성공");
        setIsAudioReady(true);
      } catch (error) {
        console.error("Audio initialization error:", error);
        Alert.alert("오류", "오디오 초기화에 실패했습니다.");
      }
    };
    initializeAudio();
  }, []);

  // Azure STT 함수 (Azure Speech SDK 사용)
  const startAzureSTT = async () => {
    console.log("startAzureSTT 시작");
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        SPEECH_KEY,
        SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = "ko-KR";
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      console.log("STT 인식 시작...");
      return new Promise<string>((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            if (result.text) {
              console.log("STT 결과:", result.text);
              resolve(result.text);
            } else {
              reject(new Error("음성 인식에 실패했습니다."));
            }
            recognizer.close();
          },
          (error) => {
            console.error("STT error:", error);
            recognizer.close();
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error("STT initialization failed:", error);
      throw error;
    }
  };

  // Azure TTS 함수: REST API와 expo-av를 이용해 음성 합성 및 재생 (한 번만 실행)
  const startSpeaking = async (text: string) => {
    console.log("startSpeaking 호출, text:", text);
    if (!text) {
      console.error("No text provided for TTS");
      return;
    }
    try {
      console.log("Starting Azure TTS (REST) with text:", text);
      setIsSpeaking(true);

      // 1) 토큰 발급
      const tokenResponse = await fetch(
        `https://${SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        {
          method: "POST",
          headers: { "Ocp-Apim-Subscription-Key": SPEECH_KEY },
        }
      );
      if (!tokenResponse.ok) {
        throw new Error("토큰 발급 실패: " + tokenResponse.status);
      }
      const accessToken = await tokenResponse.text();
      console.log("토큰 발급 완료");

      // 2) SSML 생성
      const ssml = `
<speak version='1.0' xml:lang='ko-KR'>
  <voice xml:lang='ko-KR' xml:gender='Female' name='${selectedVoice.id}'>
    ${text}
  </voice>
</speak>
      `.trim();
      console.log("SSML 생성:", ssml);

      // 3) TTS REST API 요청
      const ttsResponse = await fetch(
        `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
            "User-Agent": "ExpoTTS",
          },
          body: ssml,
        }
      );
      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        throw new Error("TTS 요청 실패: " + ttsResponse.status + " " + errText);
      }
      console.log("TTS 요청 성공");

      // 4) 음성 데이터를 파일로 저장 후 재생
      const fileUri = FileSystem.cacheDirectory + "output.wav";
      const audioData = await ttsResponse.arrayBuffer();
      const uint8Array = new Uint8Array(audioData);
      let binary = "";
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("TTS 음성 파일 저장 완료:", fileUri);

      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: fileUri });
      await soundObject.playAsync();
      console.log("TTS 음성 재생 완료");

      // 여기서는 animateText를 호출하지 않아, 이미 generateTourGuide에서 tourGuide를 설정함
      return true;
    } catch (error) {
      console.error("TTS setup error:", error);
      setIsSpeaking(false);
      throw error;
    } finally {
      setIsSpeaking(false);
    }
  };

  // 테스트용 위치 체크 함수 (경복궁 샘플 데이터 사용)
  function findNearbySpot(userCoords: Location.LocationObject["coords"]) {
    console.log("findNearbySpot 호출, userCoords:", userCoords);
    return sampleSchedule[0];
  }

  // 근처 장소 체크 및 도슨트 실행 함수
  const checkNearbySpots = async (location: Location.LocationObject) => {
    console.log("checkNearbySpots 호출, location:", location);
    if (!isGuiding) {
      const nearbySpot = findNearbySpot(location.coords);
      if (nearbySpot) {
        console.log("Found nearby spot:", nearbySpot.name);
        const guideText = await generateTourGuide(
          nearbySpot.name,
          userInterest
        );
        setIsGuiding(true);
        await startSpeaking(guideText);
      }
    }
  };

  // 위치 추적 useEffect
  useEffect(() => {
    (async () => {
      console.log("위치 권한 요청 시작");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 권한이 필요합니다");
        return;
      }
      console.log("위치 권한 허용됨");
      const fakeLocation: Location.LocationObject = {
        coords: {
          latitude: 37.579617,
          longitude: 126.977041,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
      console.log("가짜 위치 생성:", fakeLocation);
      setCurrentLocation(fakeLocation);
      checkNearbySpots(fakeLocation);
      return () => {};
    })();
  }, []);

  // 마이크 버튼 핸들러
  const handleMicPress = async () => {
    console.log("handleMicPress 호출");
    if (isGuiding) {
      Speech.stop();
      setPausedGuideText(tourGuide);
    }
    setIsRecording(true);
    try {
      const userQuestion = await startAzureSTT();
      console.log("사용자 질문:", userQuestion);
      if (userQuestion) {
        const answer = await processQuery(userQuestion);
        console.log("답변:", answer);
        if (answer) {
          await startSpeaking(answer);
          if (pausedGuideText) {
            await startSpeaking(pausedGuideText);
            setPausedGuideText(null);
          }
        }
      }
    } catch (error) {
      console.error("Voice interaction error:", error);
    } finally {
      setIsRecording(false);
    }
  };

  // 도슨트 안내 재개 버튼 핸들러
  const handleResumeGuide = async () => {
    console.log("handleResumeGuide 호출");
    if (pausedGuideText) {
      await startSpeaking(pausedGuideText);
      setPausedGuideText(null);
      setIsGuiding(true);
    }
  };

  const handleMapPress = () => {
    console.log("handleMapPress 호출");
    navigation.navigate("Map");
  };

  // generateTourGuide 함수: 샘플 문구를 "내 이름은 둘리. 빙하타고 내려왔지"로 반환
  const generateTourGuide = async (location: string, interest: string) => {
    console.log("generateTourGuide 호출:", location, interest);
    setIsLoading(true);
    try {
      const sampleGuideText = "내 이름은 둘리. 빙하타고 내려왔지";
      // 텍스트를 한 번만 설정
      setTourGuide(sampleGuideText);
      console.log("generateTourGuide 완료:", sampleGuideText);
      return sampleGuideText;
    } catch (error) {
      console.error("Error generating tour guide:", error);
      setTourGuide("죄송합니다. 설명을 불러오는데 실패했습니다.");
      return "설명 생성 실패";
    } finally {
      setIsLoading(false);
    }
  };

  // speakText 함수 (TTS 실행)
  const speakText = (text: string) => {
    startSpeaking(text);
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    audioService.current.initialize();
    return () => {
      audioService.current.cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000 }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording]);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ rotate: `${rotation.value}deg` }] };
  });

  // 자동 TTS 호출 useEffect는 제거 (한 번만 실행됨)

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

      {showVoiceModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>도슨트 음성 선택</Text>
            {voiceTypes.map((voice) => (
              <TouchableOpacity
                key={voice.id}
                style={[
                  styles.voiceOption,
                  selectedVoice.id === voice.id && styles.selectedVoice,
                  voice.disabled && styles.disabledVoice,
                ]}
                onPress={() => !voice.disabled && handleVoiceSelect(voice)}
                disabled={voice.disabled}
              >
                <View>
                  <Text
                    style={[
                      styles.voiceName,
                      voice.disabled && styles.disabledText,
                    ]}
                  >
                    {voice.name}
                  </Text>
                  <Text
                    style={[
                      styles.voiceDescription,
                      voice.disabled && styles.disabledText,
                    ]}
                  >
                    {voice.description}
                  </Text>
                </View>
                {selectedVoice.id === voice.id && !voice.disabled && (
                  <View style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.guideContainer}
        contentContainerStyle={styles.guideContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
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

      <View style={styles.voiceVisualizerContainer}>
        {isRecording && (
          <Text style={styles.listeningText}>듣고 있습니다...</Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.tabBar}>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.squareButton}
              onPress={() => setShowVoiceModal(true)}
            >
              <View style={styles.square} />
            </TouchableOpacity>

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
                    <View style={styles.micButtonBorderOuter} />
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

            <View style={styles.rightButtonContainer}>
              {isRecording ? (
                <TouchableOpacity
                  style={styles.backToStoryButton}
                  onPress={() => {}}
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
  container: { flex: 1 },
  gradient: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  backButton: { padding: 8 },
  mapButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: "600" },
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
  selectedInterest: { backgroundColor: "#007AFF" },
  interestText: { color: "#007AFF", fontSize: 16 },
  selectedInterestText: { color: "#fff" },
  guideContainer: { flex: 1, marginBottom: 120 },
  guideContent: { padding: 20 },
  textContainer: { flex: 1, padding: 16 },
  guideText: {
    fontSize: 24,
    lineHeight: 32,
    color: "#FFFFFF",
    letterSpacing: -0.3,
    fontWeight: "400",
    textAlign: "left",
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
    bottom: 140,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  listeningText: { color: "#FFFFFF", fontSize: 14, opacity: 0.8, marginTop: 8 },
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
  micButtonContainer: { width: 64, height: 64, position: "relative" },
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
  micIcon: { position: "absolute", left: "31%", top: "31%" },
  micButtonActive: { backgroundColor: "transparent" },
  userInput: {
    fontSize: 18,
    color: "#007AFF",
    marginBottom: 20,
    fontWeight: "500",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 20, color: "#666" },
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
  stopButton: { backgroundColor: "#FF3B30" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backToStoryButton: {
    width: 54,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  speakButtonIcon: { color: "#fff", fontSize: 16 },
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
  emptySpace: { width: 64, height: 64 },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    position: "absolute",
    bottom: 100,
    left: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000000",
  },
  voiceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedVoice: { backgroundColor: "#F0F0F0" },
  voiceName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  voiceDescription: { fontSize: 14, color: "#666666" },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#007AFF",
  },
  disabledVoice: { opacity: 0.5, backgroundColor: "#F5F5F5" },
  disabledText: { color: "#999999" },
});
