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
import * as Location from "expo-location";
import { Audio } from "expo-av";

type TourScreenProps = {
  navigation: any;
};

// Azure Speech Services 키와 리전 설정
const SPEECH_KEY =
  "9ot6vDP41TrM6i1MRWbtsyZrOFlXDy4UunpzMcZbT5QrzyLvEHDYJQQJ99BAACYeBjFXJ3w3AAAYACOGvVzj"; // ⚠️ 실제 키로 교체 필요
const SPEECH_REGION = "eastus";

const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

// type Interest = "건축" | "역사" | "문화" | "요리" | "자연";

// 샘플 일정 타입 정의 추가
interface SpotInfo {
  name: string;
  coords: {
    latitude: number;
    longitude: number;
  };
  description?: string;
}

// 음성 타입 정의 추가
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
  // const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [tourGuide, setTourGuide] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const characterDelay = 50; // 글자당 50ms 딜레이
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

  // 여행 일정의 위치 데이터 추출 (TMAP 지도 전달용)
  const locations = travelPlan.places.map((place) => ({
    lat: place.latitue,
    lng: place.longitude,
  }));

  // 사용자 관심사를 "요리"로 고정
  const userInterest = "요리";

  // const interests: Interest[] = ["건축", "역사", "문화", "요리", "자연"];

  // 샘플 일정 데이터
  const sampleSchedule: SpotInfo[] = [
    {
      name: "경복궁",
      coords: {
        latitude: 37.579617,
        longitude: 126.977041,
      },
      description: "조선왕조의 법궁, 수랏간과 다양한 궁중 음식 문화의 중심지",
    },
  ];

  // 사용 가능한 음성 목록
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

  // 음성 선택 핸들러 수정
  const handleVoiceSelect = async (voice: VoiceType) => {
    setSelectedVoice(voice);
    setShowVoiceModal(false);

    // 현재 위치에 대한 새로운 설명 생성
    if (currentLocation) {
      const nearbySpot = findNearbySpot(currentLocation.coords);
      if (nearbySpot) {
        const guideText = await generateTourGuide(
          nearbySpot.name,
          userInterest
        );
        setIsGuiding(true);
        startSpeaking(guideText);
      }
    }
  };

  // 텍스트를 점진적으로 표시하는 함수 수정
  const animateText = (text: string) => {
    let currentIndex = 0;
    setTourGuide("");

    const showNextCharacter = () => {
      if (currentIndex < text.length) {
        setTourGuide((prev) => {
          const newText = prev + text[currentIndex];
          // 문장 끝에서 줄바꿈 처리 수정
          if (
            text[currentIndex] === "." ||
            text[currentIndex] === "!" ||
            text[currentIndex] === "?"
          ) {
            // 다음 문자가 있고 공백이 아닌 경우에만 줄바꿈 추가
            if (
              currentIndex + 1 < text.length &&
              text[currentIndex + 1] !== " "
            ) {
              return newText + "\n\n";
            }
          }
          return newText;
        });
        currentIndex++;
        textTimeoutRef.current = setTimeout(showNextCharacter, characterDelay);
      }
    };

    showNextCharacter();
  };

  // Audio 권한 및 초기화
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Audio 권한 요청
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("오류", "오디오 권한이 필요합니다.");
          return;
        }

        // Audio 모드 설정 수정
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          // iOS 인터럽션 모드 수정
          interruptionModeIOS: Audio.InterruptionModeIOS.MixWithOthers,
          // Android 인터럽션 모드 수정
          interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        setIsAudioReady(true);
      } catch (error) {
        console.error("Audio initialization error:", error);
        Alert.alert("오류", "오디오 초기화에 실패했습니다.");
      }
    };

    initializeAudio();
  }, []);

  // Azure STT 함수 수정
  const startAzureSTT = async () => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        SPEECH_KEY,
        SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = "ko-KR";

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      console.log("Starting STT...");

      return new Promise<string>((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            if (result.text) {
              console.log("Recognized text:", result.text);
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

  // Azure TTS 함수 수정
  const startSpeaking = async (text: string) => {
    if (!text) {
      console.error("No text provided for TTS");
      return;
    }

    try {
      console.log("Starting Azure TTS with text:", text);
      setIsSpeaking(true);

      const speechConfig = sdk.SpeechConfig.fromSubscription(
        SPEECH_KEY,
        SPEECH_REGION
      );

      // 선택된 음성 적용
      speechConfig.speechSynthesisVoiceName = selectedVoice.id;
      speechConfig.speechSynthesisLanguage = "ko-KR";

      // 음성 품질 향상 설정
      speechConfig.setSpeechSynthesisOutputFormat(
        sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm
      );

      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      // 텍스트를 적절한 길이로 나누기
      const sentences = text.split(/[.!?]/g).filter(Boolean);

      for (const sentence of sentences) {
        if (sentence.trim()) {
          await new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(
              sentence.trim(),
              (result) => {
                if (
                  result.reason === sdk.ResultReason.SynthesizingAudioCompleted
                ) {
                  resolve(result);
                } else {
                  reject(new Error(result.errorDetails));
                }
              },
              (error) => {
                reject(error);
              }
            );
          });
        }
      }

      // 텍스트 표시 시작
      animateText(text);

      return true;
    } catch (error) {
      console.error("TTS setup error:", error);
      setIsSpeaking(false);
      throw error;
    } finally {
      setIsSpeaking(false);
    }
  };

  // 테스트용 위치 체크 함수 수정
  function findNearbySpot(userCoords: Location.LocationObject["coords"]) {
    // 테스트를 위해 항상 경복궁 근처라고 가정
    const testUserCoords = {
      latitude: 37.579617, // 경복궁과 동일한 좌표
      longitude: 126.977041,
    };

    // 실제 거리 계산 로직은 나중에 구현
    // 테스트를 위해 항상 첫 번째 장소 반환
    return sampleSchedule[0];
  }

  // 근처 장소 체크 및 도슨트 실행 함수 수정
  const checkNearbySpots = async (location: Location.LocationObject) => {
    if (!isGuiding) {
      const nearbySpot = findNearbySpot(location.coords);
      if (nearbySpot) {
        console.log("Found nearby spot:", nearbySpot.name);
        const guideText = await generateTourGuide(
          nearbySpot.name,
          userInterest
        );
        setIsGuiding(true);
        startSpeaking(guideText);
      }
    }
  };

  // 위치 추적 설정 useEffect 수정
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 권한이 필요합니다");
        return;
      }

      // 테스트를 위해 실제 위치 추적 대신 가짜 위치 사용
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

      // 즉시 가짜 위치로 체크 시작
      setCurrentLocation(fakeLocation);
      checkNearbySpots(fakeLocation);

      // 실제 위치 추적은 주석 처리
      // const subscription = await Location.watchPositionAsync(...)

      return () => {
        // subscription.remove();
      };
    })();
  }, []);

  // 마이크 버튼 핸들러 수정
  const handleMicPress = async () => {
    if (isGuiding) {
      // 도슨트 안내 중이면 일시 정지
      Speech.stop();
      setPausedGuideText(tourGuide);
    }

    setIsRecording(true);
    try {
      const userQuestion = await startAzureSTT();
      if (userQuestion) {
        const answer = await processQuery(userQuestion);
        if (answer) {
          await startSpeaking(answer);

          // 질문 답변 후 도슨트 안내 재개
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
    if (pausedGuideText) {
      await startSpeaking(pausedGuideText);
      setPausedGuideText(null);
      setIsGuiding(true);
    }
  };

  const handleMapPress = () => {
    navigation.navigate("Map");
  };

  const generateTourGuide = async (location: string, interest: string) => {
    setIsLoading(true);
    try {
      // 선택된 음성에 따른 캐릭터 특성 정의
      const characterTraits = {
        "ko-KR-SunHiNeural": {
          personality: "차분하고 전문적인 성우",
          style: "정확하고 전문적인 설명과 함께 역사적 맥락을 중요시하는",
          tone: "우아하고 세련된",
          examples:
            "경복궁은 조선 왕조의 중심이자, 궁중 요리의 정수가 담긴 수랏간이 있던 곳입니다. 수랏간은 임금의 식사를 준비하는 전용 공간으로, 엄선된 재료와 조리법이 사용되었습니다. 특히 궁중 음식은 계절과 의례에 맞춘 정교한 메뉴 구성으로 유명했죠. 예를 들어, '구절판'은 미적 감각과 영양 균형을 고려한 대표적 요리로, 이곳에서 탄생한 음식 중 하나입니다. 재미있게도, 수랏간의 요리사들은 궁 밖으로 나가지 못했는데, 이는 조리 비법의 유출을 막기 위함이었답니다.",
        },
        "ko-KR-JiMinNeural": {
          personality: "밝고 친근한 청년",
          style: "재미있는 일화와 현대적인 관점을 곁들인 친근하고 캐주얼한",
          tone: "활기차고 경쾌한 반말",
          examples:
            "와~ 여러분! 여기가 바로 대박 맛집의 시초였던 조선시대 수랏간이야! 임금님 수라상을 만드는 초특급 비밀 주방이었다고! 완전 대박인 건 뭔지 알아? 요리사들이 궁 밖으로 못 나갔대. 비법이 새어나갈까 봐 그랬던 거지ㅎㅎ 그리고 여기서 탄생한 '구절판'이라는 음식이 있는데, 이게 진짜 예술이야! 재료 손질부터 플레이팅까지 완전 현대 미슐랭 급이었다니까? 계절 따라 메뉴도 바뀌고, 먹방 여신 같은 의궤 덕분에 지금까지도 그 비법이 전해진다는 거 실화야?",
        },
        // "ko-KR-InJoonNeural": {
        //   personality: "부드럽고 차분한 남성",
        //   style: "깊이 있는 통찰과 철학적인 관점을 담은",
        //   tone: "차분하고 사려 깊은",
        //   examples:
        //     "이 공간에서 우리는 조선 왕실의 식문화가 얼마나 정교했는지를 엿볼 수 있습니다. 음식을 통해 국가의 위엄을 보여주었던 것이지요.",
        // },
      } as const;

      // 타입 안전성을 위한 체크 추가
      let selectedCharacter =
        characterTraits[selectedVoice.id as keyof typeof characterTraits] ||
        characterTraits["ko-KR-SunHiNeural"]; // 기본값 설정

      const messages = [
        {
          role: "system",
          content: `당신은 ${selectedCharacter.personality} 도슨트입니다. ${interest} 분야에 관심이 많은 관광객을 위해 
          ${location}에 대한 ${selectedCharacter.style} 설명을 제공해주세요.
          
          당신의 말투는 ${selectedCharacter.tone} 어조를 유지하며, 다음 사항을 포함해주세요:
          - ${interest} 관점에서 본 ${location}만의 특별한 점
          - 관련된 전문적인 용어와 설명
          - 일반 관광 가이드에서는 접할 수 없는 심층적인 정보
          - ${interest} 애호가들이 특히 관심을 가질 만한 세부사항
          
          주의사항:
          1) 최대 200자 내외의 짧은 해설을 지향합니다.
          2) 장소의 역사/배경 + 재미있는 TMI(1~2줄) 포함.
          3) 너무 긴 문장보다는 짧은 문장 중심으로 작성합니다.
          4) 각 캐릭터의 특성에 맞는 어투와 표현을 사용합니다.
          5) 한글 맞춤법과 띄어쓰기를 정확하게 지켜주세요.
          
          예시 어투:
          ${selectedCharacter.examples}`,
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
            max_tokens: 500,
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
      let content = data.choices[0].message.content;

      // 문자열 정리: 앞뒤 공백 제거 및 불필요한 문자 제거
      content = content.trim().replace(/undefined/g, "");

      if (!content) {
        throw new Error("No content in response");
      }

      setTourGuide("");
      animateText(content);
      return content;
    } catch (error) {
      console.error("Error generating tour guide:", error);
      setTourGuide("죄송합니다. 설명을 불러오는데 실패했습니다.");
      return "설명 생성 실패";
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

      {/* 음성 선택 모달 */}
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
        onContentSizeChange={() => {
          // 새 내용이 추가될 때마다 자동 스크롤
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
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
            {/* 왼쪽 버튼 - 음성 선택 */}
            <TouchableOpacity
              style={styles.squareButton}
              onPress={() => setShowVoiceModal(true)}
            >
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
    flex: 1,
    padding: 16,
  },
  guideText: {
    fontSize: 24,
    lineHeight: 32, // 줄 간격을 36에서 32로 줄임
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
});
