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
import { findMatchingInterest } from "../utils/interestUtils";
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
          .replace(/볼까\?/g, "살펴보겠습니다")
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

  // 사용 가능한 음성 목록
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

  // 음성 선택 핸들러
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

      // 현재 텍스트가 있다면 새로운 음성으로 다시 말하기
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

  // animateText 함수
  const animateText = (text: string, speakingDuration: number = 0) => {
    console.log("animateText 시작:", text, "재생시간:", speakingDuration);
    if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
    setTourGuide("");

    // 문장 단위 혹은 글자 단위로 보여주기 위해 처리
    const totalCharacters = text.length;
    const animationDuration = speakingDuration;
    const characterDelay = animationDuration / totalCharacters;

    let currentIndex = 0;
    let fullText = "";

    const showNextCharacter = () => {
      if (currentIndex < text.length) {
        fullText += text[currentIndex];
        setTourGuide(fullText);
        currentIndex++;

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

  // Azure STT (간소화 예시)
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

            // 실제로 Azure Speech SDK를 통한 STT 처리 로직
            // (예시이므로 실제 처리 생략)
            // 여기서는 단순히 "사용자가 말한 내용"이라는 가정으로 리턴
            resolve("사용자가 말한 내용 예시");
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

  // Azure TTS 함수 (REST API + expo-av)
  const startSpeaking = async (text: string | VoiceResponse) => {
    console.log("startSpeaking 호출, text:", text);
    if (!text) {
      console.error("No text provided for TTS");
      return;
    }

    try {
      // 이미 재생 중이면 중단
      if (isSpeaking) {
        console.log("이미 음성이 재생 중입니다. 이전 음성을 중지합니다.");
        await Speech.stop();
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsSpeaking(false);
      }

      if (currentSound.current) {
        console.log("startSpeaking: 이전 사운드 언로드 시작");
        await currentSound.current.unloadAsync();
        currentSound.current = null;
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("startSpeaking: 이전 사운드 언로드 완료");
      }

      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
        textTimeoutRef.current = null;
      }

      setIsLoadingStory(true);
      setShowMusicSection(false);

      // 텍스트 전처리
      let processedText = typeof text === "string" ? text : text.text;
      if (!processedText) throw new Error("Invalid text format");

      // 선택된 캐릭터 속성
      const voiceCharacter = characterTraits[selectedVoice.id];
      setIsSpeaking(true);

      // 영어 음성인 경우 한국어 -> 영어 변환
      if (voiceCharacter.language === "en-US") {
        console.log("Translating to English:", processedText);
        processedText = await translateToEnglish(processedText);
        console.log("Translated text:", processedText);
      } else {
        processedText = await Promise.resolve(
          voiceCharacter.formatMessage(processedText)
        );
      }

      // TTS 토큰 발급
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
          <voice xml:lang='${voiceCharacter.language}' 
            xml:gender='Female' 
            name='${selectedVoice.id}'>
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

      // 음성 파일로 저장 후 재생
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

      const status = await soundObject.getStatusAsync();
      const durationMillis = status.isLoaded ? status.durationMillis : 0;

      setIsLoadingStory(false);

      // 텍스트 애니메이션
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

  // (1) 위치 근접 시 자동으로 스토리 생성되는 부분에서 중복 발생
  // 여기서 generateTourGuide를 호출하면 '다음' 버튼 로직과 겹쳐서
  // 한 장소에 대해 2번씩 생성될 수 있습니다.
  // --> 주석 처리로 중복 발생을 방지합니다.
  const checkNearbySpots = async (location: Location.LocationObject) => {
    console.log("checkNearbySpots 호출, location:", location);

    // 저장된 일정이 있는지 확인
    const storedSchedule = await AsyncStorage.getItem("confirmedSchedule");
    if (!storedSchedule) {
      console.log("저장된 일정이 없어 checkNearbySpots를 실행하지 않습니다.");
      return;
    }

    if (!isGuiding) {
      try {
        const nearbySpot = await findNearbySpot(location.coords);

        // ---- 주석 처리 시작 ----
        /**
        if (nearbySpot && !isLoadingStory) {
          setIsLoadingStory(true);
          await generateTourGuide();
          setIsGuiding(true);
        }
        */
        // ---- 주석 처리 끝 ----
      } catch (error) {
        console.log("checkNearbySpots 처리 중 에러:", error);
      }
    }
  };

  // findNearbySpot 함수 (거리 계산 후 가장 가까운 장소 찾기)
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

  // 거리 계산 함수
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km 단위 거리
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // (2) 'tourState'가 바뀔 때마다 generateTourGuide 호출
  // 실제로는 '다음' 버튼을 눌렀을 때만 실행되고,
  // checkNearbySpots에서 자동 호출이 막혔으니 문제 없음
  useEffect(() => {
    const generateGuideForNextPlace = async () => {
      if (!tourState.showNextButton) {
        await generateTourGuide();
      }
    };
    generateGuideForNextPlace();
  }, [tourState]);

  // Azure AI Search (위치기반 관광지 검색)
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
      console.log("Nearby spots search completed:", response.data);
    } catch (error) {
      console.error("Nearby spots search failed:", error);
    }
  };

  // 위치 추적
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

        // 저장된 일정 체크
        const storedSchedule = await AsyncStorage.getItem("confirmedSchedule");

        // 실제 위치
        const realLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log("실제 위치 정보:", realLocation);
        setCurrentLocation(realLocation);

        if (!storedSchedule) {
          console.log("저장된 일정 없음 -> 인근 관광지 검색");
          const { latitude, longitude } = realLocation.coords;
          await fetchNearbySpots(latitude, longitude);
        } else {
          // 저장된 일정이 있을 경우 -> checkNearbySpots
          checkNearbySpots(realLocation);
        }
      } catch (error) {
        console.error("Location initialization error:", error);
      }
    })();
  }, []);

  // 일정 정보 불러오기
  const fetchSchedule = async () => {
    try {
      const response = await getSchedules();
      if (!response || !response.schedules || response.schedules.length === 0) {
        throw new Error("저장된 일정이 없습니다.");
      }

      const today = new Date().toISOString().split("T")[0];
      const todaySchedule = response.schedules.find((schedule) =>
        schedule.days.some((day) => day.date === today)
      );

      if (todaySchedule) {
        await AsyncStorage.setItem(
          "confirmedSchedule",
          JSON.stringify(todaySchedule)
        );

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

  // 마이크 버튼
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

  // 도슨트 안내 재개
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

  // (중요) 한 장소 스토리는 한 번만 생성하도록, 중복 호출 로직(위치 기반 부분) 제거
  const generateTourGuide = async () => {
    try {
      if (isSpeaking) {
        console.log("generateTourGuide: 이전 음성 중지");
        await Speech.stop();
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsSpeaking(false);
      }

      setIsLoadingStory(true);

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

      const currentPlace = todaySchedule.places[tourState.currentPlaceIndex];
      if (!currentPlace) {
        console.log("현재 장소 정보를 찾을 수 없습니다.");
        return;
      }

      const selectedCharacter = characterTraits[selectedVoice.id];
      const userPreferences = user?.preferences || ["전체"];

      // --- [관심사 로직 삽입] ---
      const placeTitle = currentPlace.title;
      const placeDesc = currentPlace.description || "";
      const interests = userPreferences;

      const bestInterest = findMatchingInterest(
        placeTitle,
        placeDesc,
        interests
      );
      console.log("최적 관심사:", bestInterest);

      let selectedPreference = bestInterest;
      // --- [관심사 로직 끝] ---

      // 이제 selectedPreference 값을 prompt나 system 메시지에 반영
      let prompt = `당신은 ${selectedCharacter.personality}입니다.
      ### 사용자 관심사 정보:
      - 주요 관심사: ${selectedPreference}
      
      ### 장소 정보:
      - 장소명: ${currentPlace.title}
      - 방문 순서: ${tourState.currentPlaceIndex + 1}/${
        todaySchedule.places.length
      }
      - 장소 설명: ${currentPlace.description || ""}`;

      const body = {
        messages: [
          {
            role: "system",
            content: `You are a ${selectedCharacter.personality} tour guide.
            Do not start with any greetings, go straight to the description.`,
          },
          {
            role: "user",
            content: `Please describe ${currentPlace.title}.`,
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

      // 캐릭터별 포맷팅
      content = selectedCharacter.formatMessage(content);

      // 마지막 장소가 아닐 때만 '다음' 안내
      const isLastPlace =
        tourState.currentPlaceIndex === todaySchedule.places.length - 1;
      const isLastDay =
        tourState.currentDayIndex === scheduleFromStorage.days.length - 1;

      if (!isLastPlace || !isLastDay) {
        content += `\n\n다음 장소로 이동해볼까요?`;
      } else {
        content += `\n\n오늘 여행은 여기서 마무리입니다.`;
      }

      setTourState((prev) => ({ ...prev, showNextButton: true }));
      setTourGuide("");
      await startSpeaking(content);

      // 이야기 후 음악
      setShowMusicSection(true);
      if (userMusicGenres.length > 0 && userData) {
        const randomGenre =
          userMusicGenres[Math.floor(Math.random() * userMusicGenres.length)];
        console.log("Selected genre:", randomGenre);

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

  // 다음 장소로 이동
  const handleNextPlace = async () => {
    try {
      console.log("handleNextPlace: 다음 장소로 이동 시작");

      // 재생 중지
      if (isSpeaking) {
        console.log("handleNextPlace: 이전 음성 중지");
        await Speech.stop();
        setIsSpeaking(false);
      }

      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
        textTimeoutRef.current = null;
      }
      setTourGuide("");

      if (currentSound.current) {
        console.log("handleNextPlace: 이전 사운드 언로드 시작");
        await currentSound.current.unloadAsync();
        currentSound.current = null;
      }

      const storedScheduleStr = await AsyncStorage.getItem("confirmedSchedule");
      if (!storedScheduleStr) {
        console.log("handleNextPlace: 일정을 찾을 수 없음");
        return;
      }

      const storedSchedule: Schedule = JSON.parse(storedScheduleStr);
      let { currentDayIndex, currentPlaceIndex } = tourState;
      const currentDay = storedSchedule.days[currentDayIndex];

      const isLastPlace = currentPlaceIndex === currentDay.places.length - 1;
      const isLastDay = currentDayIndex === storedSchedule.days.length - 1;

      const currentPlace = currentDay.places[currentPlaceIndex];
      setCurrentLocationName(currentPlace.title);

      // 마지막 장소면 피드백 모달
      if (isLastPlace) {
        console.log("handleNextPlace: 마지막 장소 -> 피드백");
        setShowFeedbackModal(true);
        return;
      }

      // 다음 장소로 인덱스 이동
      if (currentPlaceIndex < currentDay.places.length - 1) {
        currentPlaceIndex++;
      } else if (currentDayIndex < storedSchedule.days.length - 1) {
        currentDayIndex++;
        currentPlaceIndex = 0;
      }

      setTourState({
        currentDayIndex,
        currentPlaceIndex,
        showNextButton: false,
      });
    } catch (error) {
      console.error("handleNextPlace 에러:", error);
    }
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

  useEffect(() => {
    const initializeTourGuide = async () => {
      try {
        setIsInitializing(true);

        // 서버에서 일정 데이터 불러오기
        const response = await getSchedules();
        const today = new Date().toISOString().split("T")[0];

        if (response && response.schedules && response.schedules.length > 0) {
          const todaySchedule = response.schedules.find((schedule) =>
            schedule.days.some((day) => day.date === today)
          );

          if (todaySchedule) {
            await AsyncStorage.setItem(
              "confirmedSchedule",
              JSON.stringify(todaySchedule)
            );
          }
        }

        setIsInitializing(false);

        // 환영 메시지
        await welcomeMessage();
      } catch (error) {
        console.error("Error in initializeTourGuide:", error);
        setIsInitializing(false);
      }
    };

    initializeTourGuide();

    return () => {
      cleanup();
    };
  }, []);

  // 환영 메시지
  const welcomeMessage = async () => {
    try {
      setIsInitializing(true);
      setShowMusicSection(false);
      const message = "여행을 시작해볼까요?";
      await startSpeaking(message);
      setIsInitializing(false);
    } catch (error) {
      console.error("Welcome message error:", error);
      setIsInitializing(false);
    }
  };

  // 정리
  const cleanup = async () => {
    try {
      await Speech.stop();
      if (currentSound.current) {
        await currentSound.current.unloadAsync();
        currentSound.current = null;
      }
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
      }
      if (isRecording) {
        setIsRecording(false);
      }
      setIsGuiding(false);
      setIsSpeaking(false);
      setTourGuide("");
      setPausedGuideText(null);
      setIsLoadingStory(false);
      setShowMusicSection(false);
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  const handleBackPress = () => {
    cleanup();
    navigation.goBack();
  };

  // 장소에 따라 BGM
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

  // 이동 중 사용자 취향 음악
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

  useEffect(() => {
    return () => {
      musicService.current.stop();
    };
  }, []);

  // 사용자 데이터 로드
  const loadUserPreferences = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserPreferences(parsedData.preferences || []);
        setUserMusicGenres(parsedData.music_genres || []);
        setUserData({
          birthYear: parsedData.birthyear || 2000,
          musicGenres: parsedData.music_genres || [],
        });
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  };

  useEffect(() => {
    loadUserPreferences();
  }, []);

  // 음악 재생 버튼
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

  // 음악 재생/일시정지
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
          console.log("No current song, searching for new song:", userData);
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

  // 카메라 버튼
  const handleCameraPress = () => {
    navigation.navigate("Camera" as keyof RootStackParamList, {
      onPhotoTaken: async (photoUri: string) => {
        try {
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

  const isLastLocation = () => {
    if (!scheduleData) return false;

    const currentDay = tourState.currentDayIndex;
    const currentPlace = tourState.currentPlaceIndex;
    return (
      currentDay === scheduleData.days.length - 1 &&
      currentPlace === scheduleData.days[currentDay].places.length - 1
    );
  };

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
      await saveFeedback(feedbackData);

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
    marginBottom: 180,
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
    zIndex: 2,
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
    shadowOffset: { width: 0, height: 2 },
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
