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
  Pressable,
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
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import BackToStoryIcon from "../assets/backtostory.svg";
import { AudioService } from "../services/audioService";
import MicIcon from "../assets/mic.svg";
import CameraIcon from "../assets/camera.svg";
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
import { useAuth, User } from "../contexts/AuthContext";
import { getSchedules, saveFeedback } from "../api/loginapi";
import { MusicService } from "../services/musicService";
import VoiceIcon from "../assets/voice.svg";
import SongIcon from "../assets/song.svg";
import { FeedbackModal } from "../components/FeedbackModal";
import { FeedbackService } from "../services/feedbackService";
import type {
  AVPlaybackSource as ExpoAVPlaybackSource,
  AVPlaybackStatus as ExpoAVPlaybackStatus,
  AVPlaybackStatusToSet as ExpoAVPlaybackStatusToSet,
} from "expo-av/build/AV.types";

// VoiceCharacterType 인터페이스 추가
interface VoiceCharacterType {
  [key: string]: {
    personality: string;
    style: string;
    tone: string;
    examples: string;
    formatMessage: (text: string) => string | Promise<string>;
    language: string;
  };
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
    language: "ko-KR",
    examples: `석촌호수는 서울 송파구에 위치한 도심 속 자연 휴식처입니다.

이곳은 롯데월드타워와 조화를 이루며 도시와 자연이 공존하는 독특한 경관을 선보입니다.

한강에서 유입되는 물로 관리되며, 도시 생태계의 중요한 역할을 담당하고 있습니다.

조선시대부터 이어져 온 이 지역의 문화적 맥락과 현대적 발전이 어우러져 있습니다.

오늘날에는 시민들의 휴식과 문화생활이 어우러진 복합문화공간으로 자리매김하였습니다.`,
    formatMessage: (text: string) => {
      return (
        text
          // 인사말 제거 (더 포괄적인 패턴)
          .replace(/^(안녕하세요|반갑습니다)( 여러분)?[,.!]?\s*/g, "")
          .replace(/^여러분[,.!]?\s*/g, "")
          // 숫자와 단위 처리
          .replace(/(\d+\.?\d*)\s*(미터|m|M)/g, "$1m")
          .replace(/(\d+\.?\d*)\s*(킬로미터|키로|km|KM)/g, "$1km")
          .replace(/(\d+\.?\d*)\s*(센티미터|cm|CM)/g, "$1cm")
          .replace(/(\d+\.?\d*)\s*(밀리미터|mm|MM)/g, "$1mm")
          .replace(/(\d+\.?\d*)\s*(제곱미터|㎡|m2)/g, "$1㎡")
          .replace(/(\d+\.?\d*)\s*(평방미터|m²)/g, "$1㎡")
          .replace(/(\d+\.?\d*)\s*(평)/g, "$1평")
          .replace(/(\d+\.?\d*)\s*(도|°)/g, "$1°")
          .replace(/(\d+\.?\d*)\s*(원)/g, "$1원")
          // 특수문자 제거
          .replace(/[-#&]/g, "")
          // 기존 포맷팅 규칙들
          .replace(/했어요?/g, "했습니다")
          .replace(/야|이야/g, "입니다")
          .replace(/볼까\?/g, "살펴보겠습니다")
          .replace(/봐/g, "보세요")
          .replace(/줄게/g, "드리겠습니다")
          .replace(/있어/g, "있습니다")
          .replace(/(\S+)이 있습니다/g, "$1가 있습니다")
          .replace(/(\S+)이 되었습니다/g, "$1가 되었습니다")
          .replace(/(\S+)하고 (\S+)하다/g, "$1하고 $2합니다")
          .replace(/(\S+)하며 (\S+)하다/g, "$1하며 $2합니다")
          .replace(/~+/g, "")
          .replace(/!/g, ".")
          .replace(/(\S+)을통해/g, "$1을 통해")
          .replace(/(\S+)를통해/g, "$1를 통해")
          .replace(/(\S+)에서는/g, "$1에서는 ")
          .replace(
            /([가-힣]) (제공|소개|추천|안내|설명|관람|구경|체험|진행|운영|시작|종료|마무리|정리|요약|제시|제안|표현|묘사|서술|기술|전달|전파|공유|공개|발표|보고|알림|중|상태|모습|특징|분위기|매력|가치|의미|역사|전통|문화|시설|공간|장소|지역|구역|구간|코스|방향|위치|특성|특색|모양|형태|구조|성격|종류|유형|양상|현상|결과|원인|이유|계획|방법|과정|단계|순서|기간|정보|내용|사실|주제|목적|목표|대상|형태|구조|구성|요소|부분|전체|기준|조건|환경|상황|문제|해결|방안|대책|효과|영향|성과)\.?$/g,
            "$1 $2입니다."
          )
          .replace(/([가-힣])하다\.?$/g, "$1합니다.")
          .replace(/([가-힣])되다\.?$/g, "$1됩니다.")
          .replace(/([가-힣])지다\.?$/g, "$1집니다.")
          .replace(/([^.!?])$/g, "$1합니다.")
          .replace(/\.{2,}/g, ".")
          .replace(/\s+\./g, ".")
          .replace(/합니다\.$/, ".")
          .replace(/\.$\n*\.*$/g, ".")
          .trim()
      );
    },
  },
  "ko-KR-HyunsuMultilingualNeural": {
    personality: "트렌디한 MZ 인플루언서",
    style: "사용자 관심사를 현대적 관점과 SNS 감성으로 재해석하는",
    tone: "활기차고 트렌디한 반말",
    language: "ko-KR",
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
        .replace(/\./g, "!");
    },
  },
  "en-US-JaneNeural": {
    personality: "Friendly and knowledgeable local guide",
    style: "Engaging storyteller who connects history with modern culture",
    tone: "Warm and conversational English",
    language: "en-US",
    examples: `Welcome to Seokchon Lake, a serene urban oasis in Songpa District, Seoul.

The lake creates a stunning harmony with Lotte World Tower, showcasing a unique blend of nature and urban architecture.

Fed by water from the Han River, it plays a vital role in the city's ecosystem.

This area carries rich cultural heritage from the Joseon Dynasty, now beautifully merged with modern development.

Today, it serves as a vibrant cultural space where citizens come to relax and enjoy various activities.`,
    formatMessage: (text: string) => {
      // 한글 텍스트를 영어로 변환하는 로직
      return translateToEnglish(text);
    },
  },
};

// 한글을 영어로 변환하는 함수 추가
async function translateToEnglish(text: string): Promise<string> {
  try {
    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_OPENAI_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a professional translator. Translate the following Korean text to natural, conversational English while maintaining the same meaning and tone. Keep the translation concise and engaging.",
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Translation failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

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
// type AVPlaybackSource = {
//   uri?: string;
//   headers?: Record<string, string>;
//   overrideFileExtensionAndroid?: string;
// };

// type AVPlaybackStatus = {
//   isLoaded: boolean;
//   // 다른 필요한 속성들 추가
// };

// type AVPlaybackStatusToSet = Partial<AVPlaybackStatus>;

// Audio 타입 재정의
type AVPlaybackSource = ExpoAVPlaybackSource;
type AVPlaybackStatus = ExpoAVPlaybackStatus;
type AVPlaybackStatusToSet = ExpoAVPlaybackStatusToSet;

type SoundObject = {
  sound: Audio.Sound;
  status: AVPlaybackStatus;
};

// YouTube API 키 추가
const YOUTUBE_API_KEY = "AIzaSyBcAwJBnmuJVux4c3ZzcBfZrIKHbFF9jnk";

// 타입 정의 추가
interface YouTubeEvent {
  state: string;
  error?: string;
  target?: number;
  data?: any;
}

// RootStackParamList 타입 정의 수정
type RootStackParamList = {
  Main: undefined;
  홈: undefined;
  가이드: undefined;
  내일정: undefined;
  여행기록: undefined;
  Tour: undefined;
  Chat: undefined;
  Schedule: undefined;
  Map: undefined;
  Camera: {
    onPhotoTaken: (photoUri: string) => Promise<void>;
  };
};

type TourScreenNavigationProp = NavigationProp<RootStackParamList>;

export default function TourScreen() {
  const navigation = useNavigation<TourScreenNavigationProp>();
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
    videoId: string | null;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const youtubePlayerRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showExitButton, setShowExitButton] = useState(false);
  const feedbackService = useRef(new FeedbackService());
  const [scheduleData, setScheduleData] = useState<Schedule | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string>("");
  const currentSound = useRef<Audio.Sound | null>(null);

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
      description: "전문 도슨트처럼 상세한 설명을 들려주는 음성",
    },
    {
      name: "하준",
      id: "ko-KR-HyunsuMultilingualNeural",
      description: "친구같이 편하게 설명해주는 MZ 음성",
    },
    {
      name: "Stella",
      id: "en-US-JaneNeural",
      description: "Like a local friend showing you around",
    },
    {
      name: "최불암",
      id: "ko-KR-InJoonNeural",
      description: "할아버지의 정겨운 옛날이야기 같은 음성",
      disabled: true,
    },
    {
      name: "고두심",
      id: "ko-KR-JiMinNeural",
      description: "따뜻한 감성으로 이야기해주는 친근한 음성",
      disabled: true,
    },
  ];

  // 음성 선택 핸들러 수정
  const handleVoiceSelect = async (voice: VoiceType) => {
    console.log("handleVoiceSelect 시작:", voice);
    try {
      setIsLoading(true);
      if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);

      // 현재 텍스트 저장
      const currentText = tourGuide;

      // 음성 변경
      setSelectedVoice(voice);
      setShowVoiceModal(false);

      // 현재 텍스트가 있다면 새로운 음성으로 말하기
      if (currentText) {
        setTourGuide(""); // 텍스트 초기화
        await startSpeaking(currentText);
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
      // 이미 재생 중인 경우 중단
      if (isSpeaking) {
        console.log("이미 음성이 재생 중입니다. 새로운 재생을 중단합니다.");
        return;
      }

      // 이전 음성 재생 중지 및 완료 대기
      if (currentSound.current) {
        console.log("startSpeaking: 이전 사운드 언로드 시작");
        await currentSound.current.unloadAsync();
        currentSound.current = null;
        console.log("startSpeaking: 이전 사운드 언로드 완료");
      }

      // 텍스트 애니메이션 중단
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
        textTimeoutRef.current = null;
      }

      setIsLoadingStory(true);
      setShowMusicSection(false);
      console.log("Starting Azure TTS (REST) with voice:", selectedVoice.id);
      setIsSpeaking(true);

      // 텍스트 전처리
      let processedText = typeof text === "string" ? text : text.text;
      if (!processedText) {
        throw new Error("Invalid text format");
      }

      // 선택된 음성의 언어 확인 및 텍스트 변환
      const voiceCharacter = characterTraits[selectedVoice.id];
      console.log("Selected voice character:", voiceCharacter);

      if (voiceCharacter.language === "en-US") {
        console.log("Translating to English:", processedText);
        processedText = await translateToEnglish(processedText);
        console.log("Translated text:", processedText);
      } else {
        processedText = await Promise.resolve(
          voiceCharacter.formatMessage(processedText)
        );
      }

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
        <speak version='1.0' xml:lang='${voiceCharacter.language}'>
          <voice xml:lang='${
            voiceCharacter.language
          }' xml:gender='Female' name='${selectedVoice.id}'>
            ${processedText.replace(/\n/g, '<break time="500ms"/>')}
          </voice>
        </speak>
      `.trim();

      console.log("Generated SSML:", ssml);

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
      currentSound.current = soundObject;

      // 음성 파일의 재생 시간 가져오기
      const status = await soundObject.getStatusAsync();
      const durationMillis = status.isLoaded ? status.durationMillis : 0;

      setIsLoadingStory(false);

      // 텍스트 애니메이션 시작
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

    // 저장된 일정이 있는지 먼저 확인
    const storedSchedule = await AsyncStorage.getItem("confirmedSchedule");
    if (!storedSchedule) {
      console.log("저장된 일정이 없어 checkNearbySpots를 실행하지 않습니다.");
      return;
    }

    if (!isGuiding) {
      try {
        const nearbySpot = await findNearbySpot(location.coords);
        if (nearbySpot && !isLoadingStory) {
          setIsLoadingStory(true);
          await generateTourGuide();
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

      // generateTourGuide 호출 제거
      console.log("Nearby spots search completed:", response.data);
    } catch (error) {
      console.error("Nearby spots search failed:", error);
    }
  };

  // 위치 추적 useEffect
  useEffect(() => {
    (async () => {
      try {
        console.log("위치 권한 요청 시작");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("위치 권한이 필요합니다");
          return;
        }
        console.log("위치 권한 허용됨");

        // 저장된 일정이 있는지 확인
        const storedSchedule = await AsyncStorage.getItem("confirmedSchedule");

        // 실제 위치 가져오기
        const realLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log("실제 위치 정보:", realLocation);
        setCurrentLocation(realLocation);

        if (!storedSchedule) {
          // 저장된 일정이 없을 경우에만 근처 관광지 검색
          console.log("저장된 일정이 없습니다. 근처 관광지를 검색합니다.");
          const { latitude, longitude } = realLocation.coords;
          await fetchNearbySpots(latitude, longitude);
        } else {
          // 저장된 일정이 있는 경우 해당 일정의 장소들 체크
          checkNearbySpots(realLocation);
        }
      } catch (error) {
        console.error("Location initialization error:", error);
      }
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
    navigation.navigate("Map");
  };

  // generateTourGuide 함수 수정
  const generateTourGuide = async () => {
    try {
      setIsLoadingStory(true);

      // 실제 일정 데이터 가져오기
      const storedScheduleStr = await AsyncStorage.getItem("confirmedSchedule");
      if (!storedScheduleStr) {
        console.log("일정을 찾을 수 없습니다.");
        return;
      }

      const scheduleFromStorage: Schedule = JSON.parse(storedScheduleStr);
      setScheduleData(scheduleFromStorage);

      const today = new Date().toISOString().split("T")[0];
      const todaySchedule = scheduleFromStorage.days.find(
        (day) => day.date === today
      );

      if (!todaySchedule) {
        console.log("오늘의 일정을 찾을 수 없습니다.");
        return;
      }

      // 현재 장소 정보 찾기
      const currentPlace = todaySchedule.places[tourState.currentPlaceIndex];
      if (!currentPlace) {
        console.log("현재 장소 정보를 찾을 수 없습니다.");
        return;
      }

      console.log("🎯 [TourGuide] 이야기 생성 시작", {
        userId: user?.id,
        장소: currentPlace.title,
      });

      const selectedCharacter = characterTraits[selectedVoice.id];
      const userPreferences = user?.preferences || ["전체"];

      console.log("🎯 [TourGuide] 장소 설명 생성 시작", {
        장소: currentPlace.title,
        사용자ID: user?.id,
        전체관심사: userPreferences,
      });

      // 장소 설명에 가장 적합한 관심사 선택
      let selectedPreference = userPreferences[0];
      if (userPreferences.length > 1 && userPreferences[0] !== "전체") {
        // 장소 이름과 설명에서 관심사와 관련된 키워드 찾기
        const placeInfo = `${currentPlace.title} ${
          currentPlace.description || ""
        }`.toLowerCase();
        console.log("📍 [TourGuide] 장소 정보 분석", {
          장소정보: placeInfo,
        });

        const keywordMappings = {
          역사: [
            "유적",
            "고궁",
            "성곽",
            "사적지",
            "박물관",
            "전통",
            "왕조",
            "역사",
            "고대 유물",
            "문화재",
            "조선시대",
            "신라",
            "고구려",
            "백제",
            "근대사",
            "독립운동",
            "전쟁 역사",
          ],
          문화: [
            "축제",
            "전통",
            "공연",
            "문화재",
            "지역 문화",
            "행사",
            "유적지",
            "페스티벌",
            "문화 축제",
            "테마파크",
            "전통 의상",
            "한복 체험",
            "민속촌",
            "공예 체험",
          ],
          예술: [
            "예술",
            "미술",
            "음악",
            "공연",
            "전시",
            "갤러리",
            "박물관",
            "조각",
            "설치 미술",
            "현대 예술",
            "공예",
            "디자인",
            "퍼포먼스",
            "창작",
          ],
          디자인: [
            "디자인",
            "그래픽",
            "건축",
            "인테리어",
            "패션",
            "산업 디자인",
            "시각 디자인",
            "제품 디자인",
            "디자이너",
            "전시",
            "스튜디오",
            "아트센터",
          ],
          건축: [
            "건물",
            "성",
            "궁",
            "타워",
            "다리",
            "건축",
            "구조물",
            "도시계획",
            "역사적 건축물",
            "전통 건축",
            "현대 건축",
            "스카이라인",
            "지붕",
            "아치",
            "고딕 건축",
            "유럽풍 건축",
            "초고층 빌딩",
            "전통 한옥",
          ],
          음악: [
            "공연",
            "음악",
            "콘서트",
            "버스킹",
            "무대",
            "연주",
            "페스티벌",
            "재즈",
            "클래식",
            "힙합",
            "록",
            "EDM",
            "K-POP",
            "DJ",
            "오케스트라",
            "스트리트 공연",
            "합창단",
          ],
          공연: [
            "뮤지컬",
            "연극",
            "오페라",
            "콘서트",
            "무용",
            "전통 공연",
            "서커스",
            "스트리트 공연",
            "퍼포먼스 아트",
            "쇼케이스",
            "공연장",
            "즉흥 연기",
            "극단",
          ],
          "K-POP": [
            "아이돌",
            "한류",
            "팬미팅",
            "댄스",
            "음악 방송",
            "콘서트",
            "스타디움",
            "팬덤",
            "K-POP 공연",
            "연습생",
            "보이그룹",
            "걸그룹",
            "서바이벌 프로그램",
          ],
          엔터테인먼트: [
            "영화",
            "드라마",
            "놀이공원",
            "테마파크",
            "방송국",
            "게임",
            "e스포츠",
            "애니메이션",
            "코미디",
            "토크쇼",
            "아케이드",
            "넷플릭스 촬영지",
          ],
          문학: [
            "도서관",
            "책방",
            "서점",
            "시인",
            "소설",
            "문학관",
            "작가",
            "독서",
            "시집",
            "SF소설",
            "판타지",
            "추리소설",
            "고전문학",
            "서재",
            "북페어",
          ],
          과학: [
            "과학관",
            "천문대",
            "실험",
            "발명",
            "기술",
            "공학",
            "연구소",
            "로봇",
            "AI",
            "우주",
            "천체 망원경",
            "양자 물리학",
            "생물학",
            "수학",
            "코딩",
          ],
          수학: [
            "수학",
            "과학관",
            "연구소",
            "통계",
            "기하학",
            "수리 과학",
            "수학 박물관",
            "계산",
            "논리학",
            "암호학",
            "수학 체험관",
          ],
          기술: [
            "기술",
            "과학",
            "IT",
            "컴퓨터",
            "로봇",
            "AI",
            "VR",
            "AR",
            "드론",
            "스마트 기기",
            "첨단 기술",
            "연구소",
            "혁신 센터",
          ],
          경제: [
            "금융",
            "증권",
            "은행",
            "경제",
            "시장",
            "상업",
            "무역",
            "기업",
            "창업",
            "투자",
            "비즈니스",
            "증권거래소",
            "상공회의소",
          ],
          스포츠: [
            "경기장",
            "체육관",
            "야구",
            "축구",
            "농구",
            "올림픽",
            "운동",
            "체험 스포츠",
            "익스트림 스포츠",
            "서핑",
            "스노보드",
            "스케이트보드",
            "마라톤",
            "암벽 등반",
          ],
          자동차: [
            "레이싱",
            "전시장",
            "자동차 박물관",
            "모터쇼",
            "튜닝",
            "전기차",
            "스포츠카",
            "클래식카",
            "드래그 레이싱",
            "자동차 경주",
            "바이크",
            "F1",
          ],
          요리: [
            "음식",
            "맛집",
            "식당",
            "카페",
            "레스토랑",
            "먹거리",
            "푸드코트",
            "요리 체험",
            "길거리 음식",
            "전통 음식",
            "한식",
            "양식",
            "일식",
            "중식",
            "디저트",
            "미슐랭",
            "베이커리",
            "수제 맥주",
            "전통주",
          ],
          음식: [
            "맛집",
            "식당",
            "카페",
            "레스토랑",
            "먹거리",
            "푸드코트",
            "음식점",
            "전통 시장",
            "야시장",
            "푸드트럭",
            "디저트",
            "베이커리",
            "음식 축제",
            "미식",
          ],
          패션: [
            "쇼핑몰",
            "디자이너",
            "패션위크",
            "의류",
            "악세사리",
            "브랜드",
            "스타일",
            "패션 잡지",
            "스트릿 패션",
            "명품 브랜드",
            "빈티지 샵",
            "패션 트렌드",
          ],
        };

        const matchingPreferences = userPreferences.filter((pref) => {
          const keywords =
            keywordMappings[pref as keyof typeof keywordMappings] || [];
          const isMatching =
            placeInfo.includes(pref.toLowerCase()) ||
            keywords.some((keyword) => placeInfo.includes(keyword));

          if (isMatching) {
            console.log(`✨ [TourGuide] 관심사 매칭 발견: "${pref}"`, {
              매칭키워드:
                keywords.filter((k) => placeInfo.includes(k)).join(", ") ||
                pref,
            });
          }
          return isMatching;
        });

        console.log("🔍 [TourGuide] 관심사 매칭 결과", {
          매칭된_관심사:
            matchingPreferences.length > 0 ? matchingPreferences : "매칭 없음",
        });

        if (matchingPreferences.length > 0) {
          // 매칭되는 관심사 중 랜덤 선택
          selectedPreference =
            matchingPreferences[
              Math.floor(Math.random() * matchingPreferences.length)
            ];
          console.log(
            "✅ [TourGuide] 매칭된 관심사 중 선택됨:",
            selectedPreference
          );
        } else {
          // 매칭되는 관심사가 없으면 랜덤 선택
          selectedPreference =
            userPreferences[Math.floor(Math.random() * userPreferences.length)];
          console.log(
            "⚠️ [TourGuide] 매칭 없어 랜덤 선택됨:",
            selectedPreference
          );
        }
      }

      console.log("🎨 [TourGuide] 최종 스토리텔링 설정", {
        선택된_관심사: selectedPreference,
        화자_특성: selectedCharacter.personality,
        설명_스타일: selectedCharacter.style,
      });

      let prompt = `당신은 ${selectedCharacter.personality}입니다.
### 사용자 관심사 정보:
- 주요 관심사: ${selectedPreference}

### 설명 요구사항:
1. 위 관심사를 중심으로 장소를 설명해주세요.
2. ${selectedPreference}과(와) 관련된 특별한 관점이나 정보를 포함해주세요.
3. 사용자의 관심사와 장소의 특징을 자연스럽게 연결해주세요.
4. 인사말은 하지 말고 바로 장소 설명을 시작해주세요.

### 장소 정보:
- 장소명: ${currentPlace.title}
- 방문 순서: ${tourState.currentPlaceIndex + 1}번째 장소 (총 ${
        todaySchedule.places.length
      }곳 중)
- 방문 예정 시간: ${currentPlace.time}
- 장소 설명: ${currentPlace.description || ""}

### 스토리 스타일:
- ${selectedCharacter.style}
- ${selectedCharacter.tone}로 자연스럽게 설명해주세요.
- 인사말 없이 바로 본론으로 들어가주세요.`;

      const body = {
        messages: [
          {
            role: "system",
            content: `You are a ${selectedCharacter.personality} tour guide.
Your role is to provide an engaging and informative explanation about ${
              currentPlace.title
            } for tourists who are interested in ${userPreference}. 
Do not start with any greetings, go straight to the description.

Time: ${currentPlace.time}
Duration: ${currentPlace.duration}
Location: ${currentPlace.address.split(" ").slice(0, 2).join(" ")}

Your explanation style should align with ${
              selectedCharacter.style
            }, and your tone should remain ${selectedCharacter.tone}.`,
          },
          {
            role: "user",
            content: `Please describe ${
              currentPlace.title
            }, considering it's the ${tourState.currentPlaceIndex + 1}${
              tourState.currentPlaceIndex === 0 ? "st" : "th"
            } destination out of ${
              todaySchedule.places.length
            } places for today's schedule. Do not include any greetings.
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
      content = selectedCharacter.formatMessage(content);

      // 텍스트 정리
      content = content
        .replace(/undefined/g, "")
        .replace(/^\s+/, "")
        .replace(/\s+$/, "")
        // 마크다운 ** 제거
        .replace(/\*\*/g, "")
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
        // "감사." 를 제거
        .replace(/감사\./g, "")
        // 마지막 빈줄 정리
        .trim();

      // 마지막 장소가 아닌 경우에만 다음 장소 안내 추가
      const currentDay = scheduleFromStorage.days[tourState.currentDayIndex];
      const isLastPlace =
        tourState.currentPlaceIndex === currentDay.places.length - 1;
      const isLastDay =
        tourState.currentDayIndex === scheduleFromStorage.days.length - 1;

      if (!isLastPlace || !isLastDay) {
        content +=
          "\n\n다음 여정을 향해 활기차게 출발할 수 있기를 바랍니다.\n\n" +
          selectedCharacter.formatMessage(
            "노래를 들으면서 다음 장소로 이동해보세요!"
          );
      } else {
        content +=
          "\n\n오늘의 모든 여정이 마무리되었습니다. 즐거운 시간 보내셨기를 바랍니다.";
      }

      setTourState((prev) => ({ ...prev, showNextButton: true }));

      setTourGuide("");
      await startSpeaking(content);

      // 이야기가 끝나면 음악 섹션 표시 및 음악 재생
      setShowMusicSection(true);
      if (userMusicGenres.length > 0 && userData) {
        const randomGenre =
          userMusicGenres[Math.floor(Math.random() * userMusicGenres.length)];
        console.log("Selected genre:", randomGenre);
        console.log("User birth year:", userData.birthYear);

        const songInfo = await musicService.current.playUserPreferredMusic({
          birthYear: userData.birthYear,
          musicGenre: randomGenre,
        });

        if (songInfo.videoId) {
          setCurrentSong({
            title: songInfo.title,
            artist: songInfo.artist,
            videoId: songInfo.videoId,
          });
          setIsPlaying(true);
        }
      }

      return content;
    } catch (error) {
      console.error("Tour guide generation error:", error);
      setIsLoadingStory(false);
      return;
    }
  };

  // handleNextPlace 함수 내부를 수정
  const handleNextPlace = async () => {
    try {
      console.log("handleNextPlace: 다음 장소로 이동 시작");

      // 현재 재생 중인 음성 중단
      if (isSpeaking) {
        console.log("handleNextPlace: 이전 음성 재생 중지 시작");
        await Speech.stop();
        setIsSpeaking(false);
        console.log("handleNextPlace: 이전 음성 재생 중지 완료");
      }

      // 텍스트 애니메이션 중단
      if (textTimeoutRef.current) {
        console.log("handleNextPlace: 이전 텍스트 애니메이션 중지");
        clearTimeout(textTimeoutRef.current);
        textTimeoutRef.current = null;
      }
      setTourGuide(""); // 텍스트 내용 초기화

      // 현재 재생 중인 사운드가 있다면 중단
      if (currentSound.current) {
        console.log("handleNextPlace: 이전 사운드 언로드 시작");
        await currentSound.current.unloadAsync();
        currentSound.current = null;
        console.log("handleNextPlace: 이전 사운드 언로드 완료");
      }

      const storedScheduleStr = await AsyncStorage.getItem("confirmedSchedule");
      if (!storedScheduleStr) {
        console.log("handleNextPlace: 일정을 찾을 수 없음");
        return;
      }

      const storedSchedule: Schedule = JSON.parse(storedScheduleStr);
      let { currentDayIndex, currentPlaceIndex } = tourState;
      const currentDay = storedSchedule.days[currentDayIndex];

      // 마지막 장소인지 확인
      const isLastPlace = currentPlaceIndex === currentDay.places.length - 1;
      const isLastDay = currentDayIndex === storedSchedule.days.length - 1;

      // 현재 장소 정보 저장
      const currentPlace = currentDay.places[currentPlaceIndex];
      setCurrentLocationName(currentPlace.title);

      // 마지막 장소일 때 피드백 모달 표시
      if (isLastPlace) {
        console.log("handleNextPlace: 마지막 장소 도달, 피드백 모달 표시");
        setShowFeedbackModal(true);
        return;
      }

      // 다음 장소 인덱스 계산
      if (currentPlaceIndex < currentDay.places.length - 1) {
        currentPlaceIndex++;
      } else if (currentDayIndex < storedSchedule.days.length - 1) {
        currentDayIndex++;
        currentPlaceIndex = 0;
      }

      // 상태 업데이트
      setTourState({
        currentDayIndex,
        currentPlaceIndex,
        showNextButton: false,
      });

      // 다음 장소 가이드 생성은 useEffect에서 처리
    } catch (error) {
      console.error("handleNextPlace 에러:", error);
    }
  };

  // 컴포넌트 내에 useEffect 추가
  useEffect(() => {
    const generateGuideForNextPlace = async () => {
      if (!tourState.showNextButton) {
        await generateTourGuide();
      }
    };

    generateGuideForNextPlace();
  }, [tourState]);

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
      const message = "여행을 시작해볼까요?";
      await startSpeaking(message);
      setIsInitializing(false);
    } catch (error) {
      console.error("Welcome message error:", error);
      setIsInitializing(false);
    }
  };

  // cleanup 함수 수정
  const cleanup = async () => {
    try {
      // 음성 재생 중지
      await Speech.stop();

      // 현재 재생 중인 사운드 정리
      if (currentSound.current) {
        await currentSound.current.unloadAsync();
        currentSound.current = null;
      }

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
    } catch (error) {
      console.error("Cleanup error:", error);
    }
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

  // 사용자 취향 정보 로드하는 함수 수정
  const loadUserPreferences = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserPreferences(parsedData.preferences || []);
        setUserMusicGenres(parsedData.music_genres || []);
        setUserData({
          birthYear: parsedData.birthyear || 2000, // birthyear로 수정
          musicGenres: parsedData.music_genres || [],
        });
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  };

  // useEffect에서 사용자 데이터 로드
  useEffect(() => {
    loadUserPreferences();
  }, []);

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

  // 음악 재생/일시정지 핸들러 수정
  const handlePlayPause = async () => {
    try {
      console.log("handlePlayPause called, current state:", {
        isPlaying,
        currentSong,
        userData,
      });

      if (isPlaying) {
        console.log("Attempting to pause music");
        await musicService.current.pause();
        setIsPlaying(false);
      } else {
        if (currentSong?.videoId) {
          console.log("Attempting to play current song:", currentSong);
          await musicService.current.play();
          setIsPlaying(true);
        } else if (userData) {
          console.log(
            "No current song, searching for new song with user data:",
            userData
          );
          const defaultSong = {
            title: "Test Audio",
            artist: "Sample",
            videoId: "test",
          };

          setCurrentSong(defaultSong);
          setIsPlaying(true);

          const randomGenre =
            userMusicGenres.length > 0
              ? userMusicGenres[
                  Math.floor(Math.random() * userMusicGenres.length)
                ]
              : "pop";

          console.log("Selected genre for new song:", randomGenre);

          const songInfo = await musicService.current.playUserPreferredMusic({
            birthYear: userData.birthYear || 2000,
            musicGenre: randomGenre,
          });

          console.log("Received song info:", songInfo);

          if (songInfo.videoId) {
            setCurrentSong({
              title: songInfo.title,
              artist: songInfo.artist,
              videoId: songInfo.videoId,
            });
          }
        }
      }
    } catch (error) {
      console.error("Music playback error:", error);
      Alert.alert("음악 재생 오류", "음악을 재생하는 중 문제가 발생했습니다.");
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

  // 카메라 버튼 핸들러
  const handleCameraPress = () => {
    navigation.navigate("Camera" as keyof RootStackParamList, {
      onPhotoTaken: async (photoUri: string) => {
        try {
          // 사진 저장 로직 구현
          const response = await fetch("YOUR_API_ENDPOINT/photos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user?.id,
              photoUri,
              location: currentLocation,
              timestamp: new Date().toISOString(),
            }),
          });

          if (response.ok) {
            Alert.alert("성공", "사진이 저장되었습니다!");
          } else {
            throw new Error("사진 저장에 실패했습니다.");
          }
        } catch (error) {
          console.error("Photo save error:", error);
          Alert.alert("오류", "사진 저장 중 문제가 발생했습니다.");
        }
      },
    });
  };

  // 마지막 장소 체크 함수
  const isLastLocation = () => {
    if (!scheduleData) return false;

    const currentDay = tourState.currentDayIndex;
    const currentPlace = tourState.currentPlaceIndex;
    return (
      currentDay === scheduleData.days.length - 1 &&
      currentPlace === scheduleData.days[currentDay].places.length - 1
    );
  };

  // 피드백 제출 핸들러 수정
  const handleFeedbackSubmit = async (feedback: {
    rating: number;
    emotion: string;
    feedback: string;
  }) => {
    try {
      const feedbackData = {
        ...feedback,
        location: currentLocationName,
        timestamp: new Date().toISOString(),
      };

      // 피드백 저장
      await saveFeedback(feedbackData);

      // 피드백 제출 후 메시지
      const thankYouMessage =
        "피드백 감사합니다. 다음에 만날 때는 좀 더 개선된 이야기를 해드릴게요";
      setShowFeedbackModal(false);
      await startSpeaking(thankYouMessage);
      setShowExitButton(true);
    } catch (error) {
      console.error("Feedback submission error:", error);
      Alert.alert("오류", "피드백 제출 중 문제가 발생했습니다.");
    }
  };

  // 피드백 스킵 핸들러 수정
  const handleFeedbackSkip = async () => {
    try {
      const farewellMessage = "오늘 여행은 여기까지입니다. 다음에 또 만나요";
      setShowFeedbackModal(false);
      await startSpeaking(farewellMessage);
      setShowExitButton(true);
    } catch (error) {
      console.error("Feedback skip error:", error);
      setShowFeedbackModal(false);
      setShowExitButton(true);
    }
  };

  // 종료 버튼 핸들러
  const handleExit = () => {
    cleanup();
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Main",
          state: {
            routes: [
              {
                name: "MainTabs",
                state: {
                  routes: [{ name: "홈" }],
                  index: 0,
                },
              },
            ],
            index: 0,
          },
        },
      ],
    });
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
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => setShowVoiceModal(true)}
          >
            <VoiceIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
            <Map size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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

            <TouchableOpacity
              style={styles.squareButton}
              onPress={handleCameraPress}
            >
              <CameraIcon width={24} height={24} />
            </TouchableOpacity>

            <View style={styles.rightButtonContainer}>
              {showExitButton ? (
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={handleExit}
                >
                  <Text style={styles.exitButtonText}>종료</Text>
                </TouchableOpacity>
              ) : tourState.showNextButton ? (
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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowVoiceModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
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
          </Pressable>
        </Pressable>
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
              {currentSong ? (
                <Text style={styles.songTitle} numberOfLines={1}>
                  {currentSong.artist} - {currentSong.title}
                </Text>
              ) : (
                <Text style={styles.songTitle}>
                  음악을 재생하려면 클릭하세요
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.musicControlButton,
                isPlaying && styles.musicControlButtonActive,
              ]}
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

      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        onSkip={handleFeedbackSkip}
      />
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  voiceButton: {
    padding: 8,
    marginRight: 12,
  },
  mapButton: {
    padding: 8,
  },
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
    backgroundColor: "rgba(255, 255, 255, 0.3)",
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
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 32,
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
    bottom: 40,
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
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    gap: 12,
    flex: 1,
  },
  songIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  songTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
    flex: 1,
  },
  musicControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(78, 126, 184, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  musicControlButtonActive: {
    backgroundColor: "#4E7EB8",
  },
  cameraButton: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 32,
  },
  exitButton: {
    width: 64,
    height: 40,
    backgroundColor: "#FF3B30",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  exitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});
