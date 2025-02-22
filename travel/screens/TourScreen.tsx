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
import { StackNavigationProp } from "@react-navigation/stack";
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
import { useAuth } from "../contexts/AuthContext";
import { getSchedules } from "../api/loginapi";

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

// 음성 타입 정의 (기존 그대로)
interface VoiceType {
  name: string;
  id: string;
  description: string;
  disabled?: boolean;
}

// 일정 데이터 타입 정의 수정
interface ScheduleDay {
  dayIndex: number;
  date: string;
  places: {
    order: number;
    time: string;
    title: string;
    description: string;
    duration: string;
    address: string;
    cost: number;
    coords: {
      lat: number;
      lng: number;
    };
  }[];
}

interface Schedule {
  tripId: string;
  title: string;
  companion: string;
  startDate: string;
  endDate: string;
  duration: string;
  budget: string;
  transportation: string[];
  keywords: string[];
  summary: string;
  days: ScheduleDay[];
  extraInfo: {
    estimatedCost: {
      type: string;
      amount: number;
    }[];
    totalCost: number;
  };
}

// characterTraits 타입 지정
const characterTraits: VoiceCharacterType = {
  "ko-KR-SunHiNeural": {
    personality: "전문적이고 통찰력 있는 도슨트",
    style:
      "사용자의 관심사를 중심으로 장소의 맥락과 스토리를 풍부하게 전달하는",
    tone: "우아하고 세련된 존댓말",
    examples: `석촌호수는 서울 송파구에 위치한 도심 속 자연 휴식처입니다.

이곳은 롯데월드타워와 조화를 이루며 도시와 자연이 공존하는 독특한 경관을 선보입니다.

한강에서 유입되는 물로 관리되며, 도시 생태계의 중요한 역할을 담당하고 있습니다.

조선시대부터 이어져 온 이 지역의 문화적 맥락과 현대적 발전이 어우러져 있습니다.

오늘날에는 시민들의 휴식과 문화생활이 어우러진 복합문화공간으로 자리매김하였습니다.`,
    formatMessage: (text: string) => {
      return text
        .replace(/해|했어/g, "합니다|했습니다")
        .replace(/야|이야/g, "입니다")
        .replace(/볼까\?/g, "살펴보겠습니다")
        .replace(/봐/g, "보세요")
        .replace(/줄게/g, "드리겠습니다")
        .replace(/있어/g, "있습니다")
        .replace(/~+/g, "")
        .replace(/!/g, ".");
    },
  },
  "ko-KR-HyunsuMultilingualNeural": {
    personality: "트렌디한 MZ 인플루언서",
    style: "사용자 관심사를 현대적 관점과 SNS 감성으로 재해석하는",
    tone: "활기차고 트렌디한 반말",
    examples: `석촌호수는 송파구의 핫플레이스야! 봄에 벚꽃축제 할땐 여기가 인생샷 스팟이자 힐링스팟임!

롯데타워 뷰와 호수가 만나서 만드는 야경이 진짜 대박! 감성샷 건지기 완벽해!

요즘 MZ들이 환경에 관심 많잖아? 이 호수가 도시 속 힐링 스팟이면서 환경 지킴이 역할도 한다는 거 알아?

여기가 옛날에 농사짓던 곳이었다는 게 신기하지 않아? 지금은 완전 다른 느낌이야!

주말마다 플리마켓이랑 버스킹도 열리는데, 로컬 감성 제대로 느낄 수 있어!`,
    formatMessage: (text: string) => {
      return text
        .replace(/입니다|습니다/g, "야")
        .replace(/하겠습니다/g, "할게")
        .replace(/살펴보겠습니다/g, "볼까?")
        .replace(/있습니다/g, "있어")
        .replace(/였습니다/g, "였어")
        .replace(/드립니다/g, "줄게")
        .replace(/합니다/g, "해")
        .replace(/니다/g, "야")
        .replace(/시오/g, "어")
        .replace(/보세요/g, "봐")
        .replace(/이에요|예요/g, "이야")
        .replace(/\./g, "!")
        .replace(/(?<=[.!?])\s+/g, "~ ");
    },
  },
};

// 타입 정의 추가
interface ServerSchedule {
  tripId: string;
  companion: string;
  days: {
    date: string;
    places: {
      title: string;
      description?: string;
      time?: string;
    }[];
  }[];
}

interface ScheduleResponse {
  schedules: ServerSchedule[];
}

// 네비게이션 스택 타입 정의
type RootStackParamList = {
  TourScreen: undefined;
  TMapScreen: { tripInfo: Schedule }; // tripInfo 데이터 전달
};

export default function TourScreen() {
  const [scheduleData, setScheduleData] = useState<Schedule | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
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
    name: "지영",
    id: "ko-KR-SunHiNeural",
    description: "차분하고 전문적인 성우 음성",
  });
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingStory, setIsLoadingStory] = useState(false);

  // 사용자 관심사를 DB에서 가져오기(기본값은 '전체'설정)
  const userPreference = user?.preferences?.[0] || "전체";

  // 샘플 일정 데이터 (경복궁 관련 내용 그대로 유지)
  // const sampleSchedule: SpotInfo[] = [
  //   {
  //     name: "경복궁",
  //     coords: { latitude: 37.579617, longitude: 126.977041 },
  //     description: "조선왕조의 법궁, 수랏간과 다양한 궁중 음식 문화의 중심지",
  //   },
  // ];

  // 사용 가능한 음성 목록 (기존 그대로)
  const voiceTypes: VoiceType[] = [
    {
      name: "지영",
      id: "ko-KR-SunHiNeural",
      description: "차분하고 전문적인 성우 음성",
    },
    {
      name: "하준",
      id: "ko-KR-HyunsuMultilingualNeural",
      description: "밝고 친근한 청년 음성",
    },
    {
      name: "진수",
      id: "ko-KR-InJoonNeural",
      description: "부드럽고 차분한 남성 음성",
      disabled: true,
    },
  ];

  // 음성 선택 핸들러 수정
  const handleVoiceSelect = async (voice: VoiceType) => {
    console.log("handleVoiceSelect 시작:", voice);
    try {
      setIsLoading(true);
      if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
      setSelectedVoice(voice);
      setShowVoiceModal(false);

      // 현재 표시된 텍스트가 있다면 새로운 음성으로 다시 읽기
      if (tourGuide) {
        await startSpeaking(tourGuide);
      } else if (welcomeMessage) {
        // 환영 메시지가 표시중이라면 환영 메시지를 새로운 음성으로 읽기
        await startSpeaking(welcomeMessage);
      }
    } catch (error) {
      console.error("Voice selection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // animateText 함수 수정
  const animateText = (text: string, speakingDuration: number = 0) => {
    console.log("animateText 시작:", text);
    if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
    setTourGuide("");

    // 문장 단위로 분리
    const sentences = text.split(/(?<=[.!?])\s+/);
    const totalCharacters = text.length;

    // 전체 텍스트 애니메이션 시간을 음성 재생 시간과 맞춤
    const animationDuration = speakingDuration || totalCharacters * 50; // 기본값으로 글자당 50ms
    const characterDelay = animationDuration / totalCharacters;

    let currentSentenceIndex = 0;
    let currentCharIndex = 0;
    let fullText = "";

    const showNextCharacter = () => {
      if (currentSentenceIndex < sentences.length) {
        const currentSentence = sentences[currentSentenceIndex];

        if (currentCharIndex < currentSentence.length) {
          fullText += currentSentence[currentCharIndex];
          setTourGuide(fullText);
          currentCharIndex++;
          textTimeoutRef.current = setTimeout(
            showNextCharacter,
            characterDelay
          );
        } else {
          fullText += "\n\n";
          setTourGuide(fullText);
          currentSentenceIndex++;
          currentCharIndex = 0;
          textTimeoutRef.current = setTimeout(
            showNextCharacter,
            characterDelay * 2
          );
        }
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
      console.log("Starting Azure TTS (REST) with voice:", selectedVoice.id);
      setIsSpeaking(true);

      // 텍스트 전처리
      const processedText = text
        .trim()
        .replace(/undefined/g, "")
        .replace(/\n{3,}/g, "\n\n");

      // TTS 토큰 발급 및 설정
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

      // SSML 생성
      const ssml = `
        <speak version='1.0' xml:lang='ko-KR'>
          <voice xml:lang='ko-KR' xml:gender='Female' name='${
            selectedVoice.id
          }'>
            ${processedText.replace(/\n/g, '<break time="500ms"/>')}
          </voice>
        </speak>
      `.trim();

      // TTS REST API 요청
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

      // 음성 파일 저장 및 재생
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

      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: fileUri });

      // 음성 파일의 재생 시간 가져오기
      const status = await soundObject.getStatusAsync();
      const durationMillis = status.durationMillis || 0;

      // 텍스트 애니메이션 시작 (음성 재생 시간 전달)
      animateText(processedText, durationMillis);

      // 음성 재생
      await soundObject.playAsync();

      soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsSpeaking(false);
          soundObject.unloadAsync();
        }
      });

      return true;
    } catch (error) {
      console.error("TTS setup error:", error);
      setIsSpeaking(false);
      throw error;
    }
  };

  // findNearbySpot 함수 수정
  const findNearbySpot = async (
    userCoords: Location.LocationObject["coords"]
  ) => {
    try {
      const confirmedScheduleStr = await AsyncStorage.getItem(
        "confirmedSchedule"
      );
      if (!confirmedScheduleStr) return null;

      const schedule = JSON.parse(confirmedScheduleStr) as Schedule;
      const today = new Date().toISOString().split("T")[0];
      const todaySchedule = schedule.days.find((day) => day.date === today);

      if (!todaySchedule || !todaySchedule.places.length) return null;

      // 현재 위치와 가장 가까운 오늘의 일정 장소 찾기
      const nearestPlace = todaySchedule.places.find((place) => {
        // 실제 구현에서는 위치 기반 거리 계산 로직 추가
        return true; // 임시로 첫 번째 장소 반환
      });

      if (nearestPlace) {
        return {
          title: nearestPlace.title,
          description: nearestPlace.description,
          order: todaySchedule.places.indexOf(nearestPlace) + 1,
          totalPlaces: todaySchedule.places.length,
        };
      }

      return null;
    } catch (error) {
      console.error("Error finding nearby spot:", error);
      return null;
    }
  };

  // checkNearbySpots 함수 수정
  const checkNearbySpots = async (location: Location.LocationObject) => {
    console.log("checkNearbySpots 호출, location:", location);
    if (!isGuiding) {
      const nearbySpot = await findNearbySpot(location.coords);
      if (nearbySpot) {
        try {
          await generateTourGuide(
            [{ AREA_CLTUR_TRRSRT_NM: nearbySpot.title }],
            {
              title: nearbySpot.title,
              description: nearbySpot.description,
              order: nearbySpot.order,
              totalPlaces: nearbySpot.totalPlaces,
            }
          );
          setIsGuiding(true);
        } catch (error) {
          console.error("Error in checkNearbySpots:", error);
        }
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
      // 서버에서 일정 데이터 불러오기
      const response = await getSchedules();
      if (!response || !response.schedules || response.schedules.length === 0) {
        throw new Error("저장된 일정이 없습니다.");
      }

      // 오늘 날짜의 일정 찾기
      const today = new Date().toISOString().split("T")[0];
      const todaySchedule = response.schedules.find((schedule) =>
        schedule.days.some((day) => day.date === today)
      );

      if (todaySchedule) {
        // 일정이 있으면 로컬 스토리지에 저장
        await AsyncStorage.setItem(
          "confirmedSchedule",
          JSON.stringify(todaySchedule)
        );

        // 가이드 텍스트 생성
        const guideText = todaySchedule.days
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
        throw new Error("오늘의 일정이 없습니다.");
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setTourGuide(
        error instanceof Error
          ? error.message
          : "일정을 불러오는 데 실패했습니다."
      );
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
    if (!scheduleData) {
      console.warn("⚠️ 여행 일정 데이터 없음!");
      return;
    }

    navigation.navigate("TMapScreen", { tripInfo: scheduleData });
  };

  // generateTourGuide 함수 수정
  const generateTourGuide = async (
    spots: { AREA_CLTUR_TRRSRT_NM: string }[],
    scheduleInfo?: {
      title: string;
      description?: string;
      time?: string;
      order?: number;
      totalPlaces?: number;
    }
  ) => {
    try {
      const spotNames = spots.map((s) => s.AREA_CLTUR_TRRSRT_NM).join(", ");
      const selectedCharacter = characterTraits[selectedVoice.id];

      // 실제 일정 데이터 가져오기
      const storedSchedule = await AsyncStorage.getItem("confirmedSchedule");
      if (!storedSchedule) {
        throw new Error("일정을 찾을 수 없습니다.");
      }

      const schedule: Schedule = JSON.parse(storedSchedule);
      const today = new Date().toISOString().split("T")[0];
      const todaySchedule = schedule.days.find((day) => day.date === today);

      if (!todaySchedule) {
        throw new Error("오늘의 일정을 찾을 수 없습니다.");
      }

      // 현재 장소 정보 찾기
      const currentPlace = todaySchedule.places.find(
        (place) => place.title === spotNames
      );

      if (!currentPlace) {
        throw new Error("현재 장소 정보를 찾을 수 없습니다.");
      }

      const body = {
        messages: [
          {
            role: "system",
            content: `You are a ${selectedCharacter.personality} tour guide.
Your role is to provide an engaging and informative explanation about ${currentPlace.title} for tourists who are interested in ${userPreference}. 

Time: ${currentPlace.time}
Duration: ${currentPlace.duration}
Location: ${currentPlace.address}

Your explanation style should align with ${selectedCharacter.style}, and your tone should remain ${selectedCharacter.tone}. 
The explanation must include:

### **Critical Instructions:**
- Keep the response within **200 characters**.
- Use **short and concise sentences**.
- Each sentence MUST provide completely new information.
- STRICTLY NO REPETITION of words, concepts, or themes.
- Avoid redundant expressions.
- If mentioning a place or concept, describe it only once.
- Focus on diverse aspects in a structured way:
  1. Start with location and main purpose
  2. Describe unique features and processes
  3. Add interesting historical facts
  4. End with cultural significance
- Each paragraph should be separated by a line break.
- Ensure **proper Korean spelling and spacing**.
- The response **must be in Korean**.
- If this is part of today's schedule, mention the visit timing and how it connects to other destinations.

### **Example Output Style:**
${selectedCharacter.examples}`,
          },
          {
            role: "user",
            content: `Please describe ${
              currentPlace.title
            }, considering it's the ${scheduleInfo?.order}${
              scheduleInfo?.order === 1 ? "st" : "th"
            } destination out of ${
              scheduleInfo?.totalPlaces
            } places for today's schedule.
Additional context: ${currentPlace.description}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      };

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
      let content =
        data.choices[0]?.message?.content || "설명을 생성하지 못했습니다.";

      // 선택된 음성 캐릭터에 맞게 메시지 포맷팅
      content = characterTraits[selectedVoice.id].formatMessage(content);

      // 텍스트 정리
      content = content
        .replace(/undefined/g, "")
        .replace(/^\s+/, "")
        .replace(/\s+$/, "")
        .replace(/([.!?])\s*/g, "$1\n\n")
        .replace(/\n{3,}/g, "\n\n");

      // 텍스트 설정 및 음성 재생 시작
      setTourGuide("");
      await startSpeaking(content);

      return content;
    } catch (error) {
      console.error("Error generating tour guide:", error);
      return "죄송합니다. 설명을 불러오는데 실패했습니다.";
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

  // useEffect 수정 - 스토리텔링 시작
  useEffect(() => {
    const initializeTourGuide = async () => {
      try {
        setIsInitializing(true);
        await startSpeaking(welcomeMessage);
        setIsInitializing(false);

        setIsLoadingStory(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 서버에서 일정 데이터 불러오기
        const response = await getSchedules();
        const today = new Date().toISOString().split("T")[0];

        if (response && response.schedules && response.schedules.length > 0) {
          const todaySchedule = response.schedules.find((schedule) =>
            schedule.days.some((day) => day.date === today)
          );

          if (todaySchedule) {
            // 일정이 있으면 로컬 스토리지에 저장
            await AsyncStorage.setItem(
              "confirmedSchedule",
              JSON.stringify(todaySchedule)
            );

            const contextMessage = `${todaySchedule.companion}와(과) 함께하는 여행이네요. 오늘은 ${todaySchedule.days[0].places.length}곳을 방문할 예정입니다.`;
            await startSpeaking(contextMessage);

            await new Promise((resolve) => setTimeout(resolve, 2000));

            // 첫 번째 장소에 대한 상세 정보 전달
            const firstPlace = todaySchedule.days[0].places[0];
            await generateTourGuide(
              [{ AREA_CLTUR_TRRSRT_NM: firstPlace.title }],
              {
                title: firstPlace.title,
                description: firstPlace.description,
                time: firstPlace.time,
                order: 1,
                totalPlaces: todaySchedule.days[0].places.length,
              }
            );
            setIsGuiding(true);
          }
        }
      } catch (error) {
        console.error("Error in initializeTourGuide:", error);
      } finally {
        setIsLoadingStory(false);
        setIsInitializing(false);
      }
    };

    initializeTourGuide();

    // 컴포넌트 언마운트 시 cleanup 실행
    return () => {
      cleanup();
    };
  }, []);

  // TourScreen 컴포넌트 내부 상태 선언부에 추가
  const [welcomeMessage] = useState("안녕하세요! 여행을 시작해볼까요?");

  // cleanup 함수 수정
  const cleanup = () => {
    // 음성 재생 중지
    Speech.stop();

    // 현재 재생 중인 모든 음성 객체 정리
    Audio.Sound.createAsync = async () => {
      const sound = new Audio.Sound();
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error("Sound cleanup error:", error);
      }
      return { sound, status: {} };
    };

    // 텍스트 애니메이션 타이머 정리
    if (textTimeoutRef.current) {
      clearTimeout(textTimeoutRef.current);
    }

    // 녹음 중지
    if (isRecording) {
      setIsRecording(false);
    }

    // 가이드 상태 초기화
    setIsGuiding(false);
    setIsSpeaking(false);
    setTourGuide(""); // 텍스트 내용도 초기화
    setPausedGuideText(null);
    setIsLoadingStory(false);
  };

  // 뒤로가기 핸들러
  const handleBackPress = () => {
    cleanup();
    navigation.goBack();
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
      <LinearGradient
        colors={["#4E7EB8", "#89BBEC", "#9AADC4"]}
        style={styles.gradient}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: "#fff" }]}>여행 도슨트</Text>
        <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
          <Map size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isInitializing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>여행 준비 중...</Text>
        </View>
      ) : isLoadingStory ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>이야기 준비 중...</Text>
        </View>
      ) : (
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
          ) : null}
        </ScrollView>
      )}

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
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
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
