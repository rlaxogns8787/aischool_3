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
import axios from "axios";
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
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";
import { encode as btoa } from "base-64";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

//Azure AI Search 키와 인덱스
const SEARCH_ENDPOINT = "https://ssapy-ai-search.search.windows.net";
const SEARCH_KEY = "NGZcgM1vjwqKoDNPnFXcApBFttxWmGRLmnukKldPcTAzSeBjHCk6";
const ATTRACTION_INDEX = "attraction_3";

// type Interest = "건축" | "역사" | "문화" | "요리" | "자연";

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
  const [nearbySpots, setNearbySpots] = useState([]);
  const [currentSpotGuide, setCurrentSpotGuide] = useState("");
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
        console.log("오디오 권한 요청 결과:", permission);
        if (!permission.granted) {
          Alert.alert("오류", "오디오 권한이 필요합니다.");
          return;
        }
        console.log("오디오 모드 설정 시작");
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers, // 수정
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers, // 수정
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("오디오 모드 설정 성공");
        setIsAudioReady(true);
      } catch (error) {
        console.error("Audio initialization error:", error);
        Alert.alert("오류", `오디오 초기화에 실패했습니다: ${error.message}`);
      }
    };
    initializeAudio();
  }, []);

  // Azure STT 함수 (Azure Speech SDK 사용)
  const startAzureSTT = async () => {
    console.log("startAzureSTT 시작");
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error("마이크 권한이 필요합니다.");
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync();
      await recording.startAsync();

      console.log("녹음 시작...");

      // 일정 시간 후 녹음 중지
      setTimeout(async () => {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log("녹음 완료, 파일 URI:", uri);

        // 녹음된 파일을 Azure Speech SDK로 전달
        const audioConfig = sdk.AudioConfig.fromWavFileInput(uri);
        const speechConfig = sdk.SpeechConfig.fromSubscription(
          SPEECH_KEY,
          SPEECH_REGION
        );
        speechConfig.speechRecognitionLanguage = "ko-KR";
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(
          (result) => {
            if (result.text) {
              console.log("STT 결과:", result.text);
              handleVoiceCommand(result.text);
            } else {
              console.error("음성 인식에 실패했습니다.");
            }
            recognizer.close();
          },
          (error) => {
            console.error("STT error:", error);
            recognizer.close();
          }
        );
      }, 5000); // 5초 동안 녹음
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

  // [2] Azure AI Search: 관심사 + 위치 기반 관광지 추천 함수
  const fetchNearbySpots = async (latitude, longitude) => {
    try {
      const response = await axios.post(
        `${SEARCH_ENDPOINT}/indexes/${ATTRACTION_INDEX}/docs/search?api-version=2021-04-30-Preview`,
        {
          search: "*",
          filter: `geo.distance(CTLSTT_LA_LO, geography'POINT(${longitude} ${latitude})') le 20000`,
          select: "AREA_CLTUR_TRRSRT_NM, SUMRY_CN",
          top: 3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": SEARCH_KEY,
          },
        }
      );

      generateTourGuide(response.data.value);
    } catch (error) {
      console.error("Nearby spots search failed:", error);
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
      // 실제 위치 가져오기
      const realLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log("실제 위치 정보:", realLocation);
      setCurrentLocation(realLocation);
      checkNearbySpots(realLocation);
      // ✅ AI Search 기능 추가 부분 시작
      const { latitude, longitude } = realLocation.coords;
      fetchNearbySpots(latitude, longitude);
    })();
  }, []);

  // 일정 데이터 불러오기 및 스토리텔링 시작
  const fetchSchedule = async () => {
    try {
      const storedSchedule = await AsyncStorage.getItem("confirmedSchedule");
      if (storedSchedule) {
        const schedule = JSON.parse(storedSchedule);
        if (schedule && schedule.days) {
          const guideText = schedule.days
            .map((day) =>
              day.places
                .map((place) => `${place.title}: ${place.description}`)
                .join("\n")
            )
            .join("\n\n");
          setTourGuide("");
          animateText(guideText);
          await startSpeaking(guideText);
        } else {
          throw new Error("Invalid schedule format");
        }
      } else {
        throw new Error("No schedule found");
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setTourGuide("일정을 불러오는 데 실패했습니다.");
    }
  };

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

  // generateTourGuide 함수 수정: Syntax Error 해결 및 Azure AI Search 인덱스 추가
  const generateTourGuide = async (spots) => {
    const spotNames = spots.map((s) => s.AREA_CLTUR_TRRSRT_NM).join(", ");
    const body = {
      messages: [
        {
          role: "system",
          content: `당신은 사용자에게 전문적이고 흥미있는 관광 가이드를 진행해주는 가이드 도우미입니다.
          (${spotNames})에 대해 전문적이고 흥미로운 설명을 제공해주세요.
          주의사항:
          1) 최대 200자 내외의 짧은 해설을 지향.
          2) 장소의 역사/배경 + 재미있는 TMI(1~2줄) 포함.
          3) 너무 긴 문장보다, 짧은 문장 중심.
          4) 필요 시 감탄사나 비유적 표현을 적절히 사용.`,
        },
        {
          role: "user",
          content: `${spotNames}에 대한 관광 가이드를 진행해줘`,
        },
      ],
      past_messages: 10,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 800,
      data_sources: [
        {
          type: "azure_search",
          parameters: {
            endpoint: "https://ssapy-ai-search.search.windows.net",
            semantic_configuration: "attraction3-semantic",
            query_type: "semantic",
            in_scope: true,
            role_information:
              "사용자에게 전문적이고 흥미있는 관광 가이드를 진행해주는 가이드 도우미입니다.",
            filter: null,
            strictness: 1,
            top_n_documents: 5,
            key: "NGZcgM1vjwqKoDNPnFXcApBFttxWmGRLmnukKldPcTAzSeBjHCk6",
            indexName: "attraction_3",
          },
        },
      ],
    };

    try {
      const response = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_KEY,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) throw new Error("Failed to generate tour guide");

      const data = await response.json();
      const content =
        data.choices[0]?.message?.content || "가이드를 불러오지 못했습니다.";
      setTourGuide(content);
      animateText(content);
    } catch (error) {
      console.error("Error generating tour guide with search index:", error);
      setTourGuide("죄송합니다. 설명을 불러오는데 실패했습니다.");
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
