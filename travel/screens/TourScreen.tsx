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
import {
  ChevronLeft,
  Mic,
  ArrowLeft,
  Map,
  Music,
  Play,
  Pause,
} from "lucide-react-native";
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
import { useAuth } from "../contexts/AuthContext";
import { getSchedules } from "../api/loginapi";
import { MusicService } from "../services/musicService";
import VoiceIcon from "../assets/voice.svg";
import SongIcon from "../assets/song.svg";

// 상단에 타입 정의 추가
interface VoiceCharacterType {
  [key: string]: {
    personality: string;
    style: string;
    tone: string;
    examples: string;
    formatMessage: (text: string) => string;
  };
}

// User 타입 정의 추가
interface User {
  preferences: string[];
  birthYear: number;
  musicGenres: string[];
}

// 음성 관련 타입 수정
interface VoiceResponse {
  text: string;
  additionalData?: any;
}

// 기존 TourScreenProps 수정
type TourScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
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
      return (
        text
          // 기본적인 종결어미 수정
          .replace(/했어요?/g, "했습니다")
          .replace(/야|이야/g, "입니다")
          .replace(/볼까\?/g, "살펴보겠습니다")
          .replace(/봐/g, "보세요")
          .replace(/줄게/g, "드리겠습니다")
          .replace(/있어/g, "있습니다")
          // 부자연스러운 조사 수정
          .replace(/(\S+)이 있습니다/g, "$1가 있습니다")
          .replace(/(\S+)이 되었습니다/g, "$1가 되었습니다")
          // 부자연스러운 문장 연결 수정
          .replace(/(\S+)하고 (\S+)하다/g, "$1하고 $2합니다")
          .replace(/(\S+)하며 (\S+)하다/g, "$1하며 $2합니다")
          // 불필요한 문장 부호 정리
          .replace(/~+/g, "")
          .replace(/!/g, ".")
          // 띄어쓰기 교정
          .replace(/(\S+)을통해/g, "$1을 통해")
          .replace(/(\S+)를통해/g, "$1를 통해")
          .replace(/(\S+)에서는/g, "$1에서는 ")
          // 문장 마무리 정리 (수정된 부분)
          .replace(/([^.!?])$/g, "$1합니다.") // 문장 부호가 없을 때만 '합니다.' 추가
          .replace(/\.{2,}/g, ".") // 두 개 이상의 연속된 마침표를 하나로
          .replace(/\s+\./g, ".") // 마침표 앞의 불필요한 공백 제거
          .replace(/합니다\.$/, ".") // 문장 끝의 불필요한 '합니다' 제거
          .replace(/\.$\n*\.*$/g, ".") // 문장 끝의 불필요한 마침표 제거
          .trim() // 앞뒤 공백 제거
      );
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
        .replace(/합니다/g, "해")
        .replace(/했습니다/g, "했어")
        .replace(/하겠습니다/g, "할게")
        .replace(/살펴보겠습니다/g, "볼까?")
        .replace(/있습니다/g, "있어")
        .replace(/였습니다/g, "였어")
        .replace(/드립니다/g, "줄게")
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

// 상태 추가
interface TourState {
  currentDayIndex: number;
  currentPlaceIndex: number;
  showNextButton: boolean;
}

// 새로운 타입 추가
interface UserData {
  birthYear: number;
  musicGenres: string[];
}

// Audio 타입 정의 추가
type AVPlaybackSource = {
  uri?: string;
  headers?: Record<string, string>;
  overrideFileExtensionAndroid?: string;
};

type AVPlaybackStatus = {
  isLoaded: boolean;
  // 다른 필요한 속성들 추가
};

type AVPlaybackStatusToSet = Partial<AVPlaybackStatus>;

type SoundObject = {
  sound: Audio.Sound;
  status: AVPlaybackStatus;
};

export default function TourScreen() {
  const navigation = useNavigation<any>();
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
  const [tourState, setTourState] = useState<TourState>({
    currentDayIndex: 0,
    currentPlaceIndex: 0,
    showNextButton: false,
  });
  const [currentBGM, setCurrentBGM] = useState<string | null>(null);
  const musicService = useRef(new MusicService());
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [userMusicGenres, setUserMusicGenres] = useState<string[]>([]);
  const [showMusicButton, setShowMusicButton] = useState(false);
  const [showMusicSection, setShowMusicSection] = useState(false);
  const [currentSong, setCurrentSong] = useState<{
    title: string;
    artist: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

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
      } else {
        // 환영 메시지 다시 읽기
        await welcomeMessage();
      }
    } catch (error) {
      console.error("Voice selection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // animateText 함수 수정
  const animateText = (text: string, speakingDuration: number = 0) => {
    console.log("animateText 시작:", text, "재생시간:", speakingDuration);
    if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
    setTourGuide("");

    // 문장 단위로 분리
    const sentences = text.split(/(?<=[.!?])\s+/);
    const totalCharacters = text.length;

    // 음성 재생 시간에 맞춰 애니메이션 속도 조절
    const animationDuration = speakingDuration;
    const characterDelay = animationDuration / totalCharacters;

    let currentIndex = 0;
    let fullText = "";

    const showNextCharacter = () => {
      if (currentIndex < text.length) {
        fullText += text[currentIndex];
        setTourGuide(fullText);
        currentIndex++;

        // 문장 끝에서 약간의 추가 딜레이
        const isEndOfSentence = /[.!?]/.test(text[currentIndex - 1]);
        const nextDelay = isEndOfSentence ? characterDelay * 2 : characterDelay;

        textTimeoutRef.current = setTimeout(showNextCharacter, nextDelay);
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
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("오디오 모드 설정 성공");
        setIsAudioReady(true);
      } catch (error) {
        const err = error as Error;
        console.error("Audio initialization error:", err);
        Alert.alert("오류", `오디오 초기화에 실패했습니다: ${err.message}`);
      }
    };
    initializeAudio();
  }, []);

  // Azure STT 함수 (Azure Speech SDK 사용)
  const startAzureSTT = async (): Promise<string | null> => {
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

      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log("녹음 완료, 파일 URI:", uri);

            if (!uri) {
              resolve(null);
              return;
            }

            // 녹음된 파일을 Azure Speech SDK로 전달
            const audioConfig = sdk.AudioConfig.fromWavFileInput(
              Buffer.from(uri)
            );
            const speechConfig = sdk.SpeechConfig.fromSubscription(
              SPEECH_KEY,
              SPEECH_REGION
            );
            speechConfig.speechRecognitionLanguage = "ko-KR";
            const recognizer = new sdk.SpeechRecognizer(
              speechConfig,
              audioConfig
            );

            recognizer.recognizeOnceAsync(
              (result) => {
                if (result.text) {
                  console.log("STT 결과:", result.text);
                  resolve(result.text);
                } else {
                  console.error("음성 인식에 실패했습니다.");
                  resolve(null);
                }
                recognizer.close();
              },
              (error) => {
                console.error("STT error:", error);
                recognizer.close();
                reject(error);
              }
            );
          } catch (error) {
            reject(error);
          }
        }, 5000);
      });
    } catch (error) {
      console.error("STT initialization failed:", error);
      throw error;
    }
  };

  // Azure TTS 함수: REST API와 expo-av를 이용해 음성 합성 및 재생 (한 번만 실행)
  const startSpeaking = async (text: string | VoiceResponse) => {
    console.log("startSpeaking 호출, text:", text);
    if (!text) {
      console.error("No text provided for TTS");
      return;
    }

    try {
      setIsLoadingStory(true);
      setShowMusicSection(false); // 음성 재생 시작할 때 음악 섹션 숨기기
      console.log("Starting Azure TTS (REST) with voice:", selectedVoice.id);
      setIsSpeaking(true);

      // 텍스트 전처리
      const processedText = typeof text === "string" ? text : text.text;

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
      const durationMillis = status.isLoaded ? status.durationMillis : 0;

      setIsLoadingStory(false);

      // 텍스트 애니메이션 시작 (약간의 지연을 두고 시작)
      setTimeout(() => {
        animateText(processedText, durationMillis);
      }, 100);

      // 음성 재생
      await soundObject.playAsync();

      soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(false);
          soundObject.unloadAsync();
          // 웰컴 메시지가 아닐 때만 음악 섹션 표시
          if (!isInitializing) {
            setShowMusicSection(true);
          }
        }
      });

      return true;
    } catch (error) {
      console.error("TTS setup error:", error);
      setIsSpeaking(false);
      setIsLoadingStory(false);
      throw error;
    }
  };

  // checkNearbySpots 함수 수정
  const checkNearbySpots = async (location: Location.LocationObject) => {
    console.log("checkNearbySpots 호출, location:", location);
    if (!isGuiding) {
      try {
        const nearbySpot = await findNearbySpot(location.coords);
        if (nearbySpot) {
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
        } else {
          // 근처 장소를 찾지 못했을 때 조용히 처리
          console.log("근처에서 일정에 있는 장소를 찾지 못했습니다.");
        }
      } catch (error) {
        // 에러 발생 시 조용히 처리
        console.log("checkNearbySpots 처리 중 에러:", error);
      }
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
      if (!confirmedScheduleStr) {
        console.log("저장된 일정이 없습니다.");
        return null;
      }

      const schedule = JSON.parse(confirmedScheduleStr) as Schedule;
      const today = new Date().toISOString().split("T")[0];
      const todaySchedule = schedule.days.find(
        (day: { date: string }) => day.date === today
      );

      if (!todaySchedule || !todaySchedule.places.length) {
        console.log("오늘의 일정이 없습니다.");
        return null;
      }

      // 현재 위치와 가장 가까운 오늘의 일정 장소 찾기
      const nearestPlace = todaySchedule.places.reduce((nearest, place) => {
        if (!nearest) return place;

        const placeDistance = calculateDistance(
          userCoords.latitude,
          userCoords.longitude,
          place.coords.lat,
          place.coords.lng
        );
        const nearestDistance = calculateDistance(
          userCoords.latitude,
          userCoords.longitude,
          nearest.coords.lat,
          nearest.coords.lng
        );

        return placeDistance < nearestDistance ? place : nearest;
      }, todaySchedule.places[0]);

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
      console.log("findNearbySpot 처리 중 에러:", error);
      return null;
    }
  };

  // 거리 계산 함수 추가
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // 지구의 반경 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 거리 (km)
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // [2] Azure AI Search: 관심사 + 위치 기반 관광지 추천 함수
  const fetchNearbySpots = async (latitude: number, longitude: number) => {
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
      const todaySchedule = response.schedules.find(
        (schedule: ServerSchedule) =>
          schedule.days.some((day: { date: string }) => day.date === today)
      );

      if (todaySchedule) {
        // 일정이 있으면 로컬 스토리지에 저장
        await AsyncStorage.setItem(
          "confirmedSchedule",
          JSON.stringify(todaySchedule)
        );

        // 가이드 텍스트 생성
        const guideText = todaySchedule.days
          .map((day: { places: any[] }) =>
            day.places
              .map(
                (place: { title: string; description: string }) =>
                  `${place.title}: ${place.description}`
              )
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
    console.log("handleMapPress 호출");
    navigation.navigate("Map" as never);
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
      setIsLoadingStory(true);
      const spotNames = spots.map((s) => s.AREA_CLTUR_TRRSRT_NM).join(", ");
      const selectedCharacter = characterTraits[selectedVoice.id];

      // 사용자 관심사를 기반으로 이야기 생성
      const userInterests = userPreferences.join(", ");
      let prompt = `당신은 ${selectedCharacter.personality}입니다. `;
      prompt += `방문객이 ${userInterests}에 관심이 많습니다. `;
      prompt += `${spotNames}에 대해 방문객의 관심사를 고려하여 설명해주세요.`;

      // 실제 일정 데이터 가져오기
      const storedSchedule = await AsyncStorage.getItem("confirmedSchedule");
      if (!storedSchedule) {
        console.log("일정을 찾을 수 없습니다.");
        return;
      }

      const schedule: Schedule = JSON.parse(storedSchedule);
      const today = new Date().toISOString().split("T")[0];
      const todaySchedule = schedule.days.find(
        (day: { date: string }) => day.date === today
      );

      if (!todaySchedule) {
        console.log("오늘의 일정을 찾을 수 없습니다.");
        return;
      }

      // 현재 장소 정보 찾기
      const currentPlace = todaySchedule.places.find(
        (place: { title: string }) => place.title === spotNames
      );

      if (!currentPlace) {
        console.log("현재 장소 정보를 찾을 수 없습니다.");
        return;
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
        // 숫자와 단위가 줄바꿈으로 분리되는 것 방지
        .replace(/(\d+)\.\s*\n\s*(\d+)([a-zA-Z가-힣]+)/g, "$1.$2$3")
        // 불필요한 줄바꿈 정리
        .replace(/([^.!?])\n+/g, "$1 ")
        // 문장 끝에서 줄바꿈
        .replace(/([.!?])\s*/g, "$1\n\n")
        // 연속된 줄바꿈 정리
        .replace(/\n{3,}/g, "\n\n")
        // 단독 마침표 제거
        .replace(/^\s*\.\s*$/gm, "")
        // 마지막 빈줄 정리
        .trim();

      // 마지막 장소가 아닌 경우에만 다음 장소 안내 추가
      const scheduleData: Schedule = JSON.parse(
        (await AsyncStorage.getItem("confirmedSchedule")) || "{}"
      );
      const currentDay = scheduleData.days[tourState.currentDayIndex];
      const isLastPlace =
        tourState.currentPlaceIndex === currentDay.places.length - 1;
      const isLastDay =
        tourState.currentDayIndex === scheduleData.days.length - 1;

      if (!isLastPlace || !isLastDay) {
        content += "\n\n노래를 들으면서 다음 장소로 이동해보세요!";
        setTourState((prev) => ({ ...prev, showNextButton: true }));
      }

      setTourGuide("");
      await startSpeaking(content);

      // 이야기가 끝나면 음악 섹션 표시 및 음악 재생
      setShowMusicSection(true);
      if (userMusicGenres.length > 0 && userData) {
        const randomGenre =
          userMusicGenres[Math.floor(Math.random() * userMusicGenres.length)];
        const songInfo = await handleTransitMusic(randomGenre);
        if (songInfo) {
          setCurrentSong(songInfo);
          setIsPlaying(true);
        }
      }

      return content;
    } catch (error) {
      console.log("Tour guide generation:", error);
      setIsLoadingStory(false);
      // 에러가 발생해도 조용히 처리
      return;
    }
  };

  // 다음 장소로 이동하는 함수 추가
  const handleNextPlace = async () => {
    try {
      const storedSchedule: Schedule = JSON.parse(
        (await AsyncStorage.getItem("confirmedSchedule")) || "{}"
      );
      let { currentDayIndex, currentPlaceIndex } = tourState;

      const currentDay = storedSchedule.days[currentDayIndex];

      if (currentPlaceIndex < currentDay.places.length - 1) {
        // 같은 날의 다음 장소로 이동
        currentPlaceIndex++;
      } else if (currentDayIndex < storedSchedule.days.length - 1) {
        // 다음 날의 첫 장소로 이동
        currentDayIndex++;
        currentPlaceIndex = 0;
      }

      setTourState({
        currentDayIndex,
        currentPlaceIndex,
        showNextButton: false,
      });

      const nextPlace =
        storedSchedule.days[currentDayIndex].places[currentPlaceIndex];
      await generateTourGuide([{ AREA_CLTUR_TRRSRT_NM: nextPlace.title }], {
        title: nextPlace.title,
        description: nextPlace.description,
        time: nextPlace.time,
        order: currentPlaceIndex + 1,
        totalPlaces: currentDay.places.length,
      });
    } catch (error) {
      console.error("Error moving to next place:", error);
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
        setIsInitializing(true); // 초기 로딩 상태 시작

        // 서버에서 일정 데이터 불러오기
        const response = await getSchedules();
        const today = new Date().toISOString().split("T")[0];

        if (response && response.schedules && response.schedules.length > 0) {
          const todaySchedule = response.schedules.find(
            (schedule: ServerSchedule) =>
              schedule.days.some((day: { date: string }) => day.date === today)
          );

          if (todaySchedule) {
            // 일정이 있으면 로컬 스토리지에 저장
            await AsyncStorage.setItem(
              "confirmedSchedule",
              JSON.stringify(todaySchedule)
            );
          }
        }

        setIsInitializing(false); // 초기 로딩 상태 종료

        // 웰컴 메시지 시작
        await welcomeMessage();
      } catch (error) {
        console.error("Error in initializeTourGuide:", error);
        setIsInitializing(false);
      }
    };

    initializeTourGuide();

    // 컴포넌트 언마운트 시 cleanup 실행
    return () => {
      cleanup();
    };
  }, []);

  // welcomeMessage 함수 수정
  const welcomeMessage = async () => {
    try {
      setIsInitializing(true);
      setShowMusicSection(false); // 웰컴 메시지 시작할 때 음악 섹션 숨기기
      const message = "안녕하세요! 여행을 시작해볼까요?";
      await startSpeaking(message);
      setIsInitializing(false);
    } catch (error) {
      console.error("Welcome message error:", error);
      setIsInitializing(false);
    }
  };

  // cleanup 함수 수정
  const cleanup = () => {
    // 음성 재생 중지
    Speech.stop();

    // 현재 재생 중인 모든 음성 객체 정리
    const originalCreateAsync = Audio.Sound.createAsync;
    Audio.Sound.createAsync = async (
      source: any, // 임시로 any 타입 사용
      initialStatus?: AVPlaybackStatusToSet,
      onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null,
      downloadFirst?: boolean
    ): Promise<SoundObject> => {
      const sound = new Audio.Sound();
      try {
        await sound.unloadAsync();
      } catch (error) {
        const err = error as Error;
        console.error("Sound cleanup error:", err);
      }
      return {
        sound,
        status: { isLoaded: true } as AVPlaybackStatus,
      };
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
    setShowMusicSection(false); // 컴포넌트 정리 시 음악 섹션 숨기기
  };

  // 뒤로가기 핸들러
  const handleBackPress = () => {
    cleanup();
    navigation.goBack();
  };

  // 장소에 도착했을 때 BGM 재생
  const handleLocationArrival = async (location: string) => {
    try {
      const response = await musicService.current.playLocationBGM(location);
      if (response && response.videoId) {
        setCurrentBGM(response.videoId);
      }
    } catch (error) {
      console.error("BGM playback error:", error);
    }
  };

  // 이동 중 사용자 취향 음악 재생
  const handleTransitMusic = async (userGenre: string) => {
    try {
      if (!userData) return null;

      const songInfo = await musicService.current.playUserPreferredMusic({
        birthYear: userData.birthYear,
        musicGenre: userGenre,
      });

      if (songInfo.videoId) {
        setCurrentBGM(songInfo.videoId);
        return {
          title: songInfo.title,
          artist: songInfo.artist,
        };
      }
      return null;
    } catch (error) {
      console.error("Transit music error:", error);
      return null;
    }
  };

  // 컴포넌트 cleanup
  useEffect(() => {
    return () => {
      musicService.current.stop();
    };
  }, []);

  // 사용자 취향 정보 로드하는 함수 추가
  const loadUserPreferences = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserPreferences(parsedData.preferences || []);
        setUserMusicGenres(parsedData.music_genres || []);
        setUserData({
          birthYear: parsedData.birthYear || 2000, // 기본값 설정
          musicGenres: parsedData.music_genres || [],
        });
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  };

  // 음악 재생 버튼 컴포넌트 추가
  const MusicButton = () => (
    <TouchableOpacity
      style={styles.musicButton}
      onPress={() => {
        if (userMusicGenres.length > 0) {
          const randomGenre =
            userMusicGenres[Math.floor(Math.random() * userMusicGenres.length)];
          handleTransitMusic(randomGenre);
        }
      }}
    >
      <Music size={24} color="#FFFFFF" />
      <Text style={styles.musicButtonText}>음악 재생</Text>
    </TouchableOpacity>
  );

  // 음악 재생/일시정지 핸들러 추가
  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await musicService.current.pause();
        setIsPlaying(false);
      } else {
        if (userMusicGenres.length > 0) {
          const randomGenre =
            userMusicGenres[Math.floor(Math.random() * userMusicGenres.length)];
          const songInfo = await handleTransitMusic(randomGenre);
          setCurrentSong(songInfo);
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Music playback error:", error);
    }
  };

  // handleVoiceCommand 함수 수정
  const handleVoiceCommand = async (text: string) => {
    try {
      const response = await processQuery(text);
      if (response && response.text) {
        await startSpeaking(response);
      }
    } catch (error) {
      console.error("Voice command error:", error);
    }
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
          <Text style={styles.loadingText}>잠시만 기다려주세요...</Text>
        </View>
      ) : (
        <View style={styles.guideContainer}>
          <ScrollView
            style={styles.guideContent}
            ref={scrollViewRef}
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            <Text style={styles.guideText}>{tourGuide}</Text>
          </ScrollView>
        </View>
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
              <VoiceIcon width={24} height={24} />
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
              {tourState.showNextButton ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNextPlace}
                >
                  <Text style={styles.nextButtonText}>다음</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptySpace} />
              )}
            </View>
          </View>
        </View>
      </View>

      {showVoiceModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>음성 선택</Text>
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
                {selectedVoice.id === voice.id && (
                  <View style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showMusicButton && !isLoadingStory && <MusicButton />}

      {/* 음악 재생 섹션 */}
      {showMusicSection && !isLoadingStory && !isInitializing && (
        <View style={styles.musicSection}>
          <View style={styles.musicContent}>
            <View style={styles.musicInfo}>
              <View style={styles.songIconContainer}>
                <SongIcon width={20} height={20} color="#FFFFFF" />
              </View>
              {currentSong && (
                <Text style={styles.songTitle} numberOfLines={1}>
                  {currentSong.artist} - {currentSong.title}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.musicControlButton}
              onPress={handlePlayPause}
            >
              {isPlaying ? (
                <Pause size={16} color="#FFFFFF" />
              ) : (
                <Play size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  guideContainer: {
    flex: 1,
    marginBottom: 180, // 하단 여백 증가 (마이크 버튼 + 음악 섹션 높이)
  },
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
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    zIndex: 2, // 음악 섹션보다 위에 표시되도록
    marginTop: 16,
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
    width: "90%",
    maxWidth: 400,
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000000",
    textAlign: "center",
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
  selectedVoice: {
    backgroundColor: "#F0F0F0",
  },
  voiceName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  voiceDescription: {
    fontSize: 14,
    color: "#666666",
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#007AFF",
  },
  disabledVoice: {
    opacity: 0.5,
    backgroundColor: "#F5F5F5",
  },
  disabledText: {
    color: "#999999",
  },
  nextButton: {
    width: 64,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  musicButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  musicButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  musicSection: {
    position: "absolute",
    bottom: 84,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 1,
    marginBottom: 24,
  },
  musicContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
  },
  musicInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  songIconContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  songTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400",
    flex: 1,
  },
  musicControlButton: {
    width: 32,
    height: 32,
    borderRadius: 100,
    backgroundColor: "#4E7EB8",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
});
