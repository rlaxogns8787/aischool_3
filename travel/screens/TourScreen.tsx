import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Mic } from "lucide-react-native";
import MapIcon from "../assets/map.svg";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";

type TourScreenProps = {
  navigation: any;
};

const SPEECH_API_URL = "http://localhost:3000/api/speech-to-text";

export default function TourScreen({ navigation }: TourScreenProps) {
  const [fullText] = useState(
    "경복궁은 대한민국의 수도 서울에 위치한 궁전으로 '큰 복을 누리며 번성하라' 라는 뜻을 지니고 있습니다. 면적은 약 43만 제곱미터로 축구장 60개 정도의 크기입니다..."
  );
  const [displayedText, setDisplayedText] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [userInput, setUserInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;

    const animateText = async () => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        setHighlightIndex(currentIndex);

        // 한 글자씩 표시하는 속도 (50ms)
        timeoutId = setTimeout(animateText, 50);
        currentIndex++;
      }
    };

    // TTS 시작
    const startSpeaking = async () => {
      try {
        await Speech.stop();
        await Speech.speak(fullText, {
          language: "ko",
          pitch: 1.0,
          rate: 0.9,
          onBoundary: (event) => {
            // 음성이 특정 위치에 도달할 때마다 호출
            setHighlightIndex(event.charIndex);
          },
        });
      } catch (error) {
        console.error("TTS error:", error);
      }
    };

    animateText();
    startSpeaking();

    return () => {
      clearTimeout(timeoutId);
      Speech.stop();
    };
  }, [fullText]);

  const startRecording = async () => {
    try {
      // 오디오 권한 요청
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        alert("마이크 권한이 필요합니다.");
        return;
      }

      // 오디오 녹음 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecording(true);
      setUserInput("듣고 있습니다...");

      // 녹음 시작
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
      setUserInput("음성 인식에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      setIsRecording(false);

      const uri = recording.getURI();
      if (!uri) throw new Error("녹음 파일을 찾을 수 없습니다.");

      setUserInput("음성을 텍스트로 변환하는 중...");

      // 녹음된 파일을 서버로 전송
      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/wav",
        name: "speech.wav",
      } as any);

      const response = await fetch(SPEECH_API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Server error:", errorData);
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("Server response:", data); // 서버 응답 로깅

      if (data.text) {
        setUserInput(data.text);
      } else {
        setUserInput("음성을 텍스트로 변환하지 못했습니다.");
      }

      setRecording(null);
    } catch (error) {
      console.error("Full error:", error);
      setRecording(null);
      setIsRecording(false);
      setUserInput("음성 인식에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSendMessage = async (text: string) => {
    // 사용자 메시지 추가
    setDisplayedText(text);
  };

  const handleMapPress = () => {
    navigation.navigate("Map");
  };

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
        {userInput ? <Text style={styles.userInput}>{userInput}</Text> : null}
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
});
