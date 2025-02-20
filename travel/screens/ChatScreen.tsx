import React, { useState, useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import {
  chatWithAI,
  generateTravelSchedule,
  generateImage,
} from "../api/openai";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { styles } from "../styles/chatScreen";
import { Message, MessageOption, TripInfo } from "../types/chat";
import { INITIAL_MESSAGE, COMPANION_OPTIONS } from "../constants/chat";
import { formatDate, extractTripInfo } from "../utils/messageUtils";
import { Schedule } from "../types/schedule";
import RefreshChatIcon from "../assets/refreshchat.svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RootStackParamList = {
  Chat: undefined;
  Schedule: undefined;
  // 다른 스크린들도 필요하다면 여기에 추가
};

// 옵션 버튼 컴포넌트
const OptionButton = ({
  text,
  onPress,
  selected,
}: {
  text: string;
  onPress: () => void;
  selected?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.optionButton, selected && styles.optionButtonSelected]}
    onPress={onPress}
  >
    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
      {text}
    </Text>
  </TouchableOpacity>
);

// 메시지 타입 정의 추가
interface AIResponse {
  timestamp: string;
  message: string;
  type: "ai" | "user";
  metadata?: {
    location?: string;
    topic?: string;
    context?: string;
  };
}

export default function ChatScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [datePickerMode, setDatePickerMode] = useState<"start" | "end">(
    "start"
  );
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);
  const [showScheduleButtons, setShowScheduleButtons] = useState(false);
  const [selectedOption, setSelectedOption] = useState<
    "recreate" | "confirm" | null
  >(null);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: "recreate" | "confirm" | null;
  }>({});
  const [disabledButtons, setDisabledButtons] = useState<{
    [key: string]: boolean;
  }>({});

  // AI 응답 저장을 위한 state 추가
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);

  // 초기 메시지 설정
  useEffect(() => {
    setMessages([INITIAL_MESSAGE]);
  }, []);

  // 메시지 개수 확인
  useEffect(() => {}, [messages]);

  // 메시지 업데이트 헬퍼 함수
  const updateMessages = (newMessages: Message[], removePattern?: string) => {
    setMessages((prev) => {
      let filtered = removePattern
        ? prev.filter((msg) => !msg.text.includes(removePattern))
        : prev;
      filtered = filtered.filter((msg) => msg.id !== "loading");
      return filtered.concat(newMessages);
    });
  };

  // 옵션 선택 처리
  const handleOptionSelect = async (option: number) => {
    // 초기 메시지 옵션 선택 처리
    if (
      messages.some((msg) => msg.text.includes("아래 두 옵션 중 하나를 선택"))
    ) {
      setShowOptions(false);
      const optionText =
        option === 1
          ? "저는 이미 생각한 여행일정 있어요."
          : "여행은 가고싶지만 처음부터 도와주세요";

      // 사용자 선택 메시지
      const userMessage: Message = {
        id: Date.now().toString(),
        text: optionText,
        isBot: false,
        timestamp: new Date().toISOString(),
      };

      // 초기 메시지 제거 후 사용자 메시지만 추가
      setMessages((prev) =>
        prev
          .filter((msg) => !msg.text.includes("아래 두 옵션 중 하나를 선택"))
          .concat(userMessage)
      );

      await handleSendMessage(optionText + "_selected");
      return;
    }

    // 여행 인원 선택 처리
    if (messages.some((msg) => msg.text.includes("누구와 함께 여행하시나요"))) {
      const companionOptions = [
        "혼자",
        "친구와 함께",
        "가족과 함께",
        "부모님과 함께",
        "연인과 함께",
      ];
      const companionText = companionOptions[option - 1];

      // 사용자 선택 메시지
      const userMessage: Message = {
        id: Date.now().toString(),
        text: companionText,
        isBot: false,
        timestamp: new Date().toISOString(),
      };

      // AI 응답 메시지
      const confirmMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `${companionText} 여행을 준비하겠습니다. 😊`,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      // 도슨트 안내 메시지 추가
      const docentGuideMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "🎧 안내사항: 여행 중 AI 도슨트 서비스 이용을 위해 헤드폰 또는 에어팟 착용이 필요합니다.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      // 다음 질문 (예산)
      const nextQuestion: Message = {
        id: (Date.now() + 3).toString(),
        text: "여행 예산은 어느 정도로 생각하고 계신가요?(만원단위 - 숫자만 입력)",
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      // 이전 메시지들을 필터링하고 새로운 메시지들 추가
      setMessages((prev) =>
        prev
          .filter(
            (msg) =>
              !msg.text.includes("누구와 함께 여행하시나요") &&
              !msg.text.includes("아래 두 옵션 중 하나를 선택")
          )
          .concat([
            userMessage,
            confirmMessage,
            docentGuideMessage,
            nextQuestion,
          ])
      );

      return;
    }
  };

  // 여행 기간 처리 함수 수정
  const handleTripDuration = (text: string) => {
    const lastDateMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.text.includes("에 출발하는 여행이군요"));

    if (lastDateMessage) {
      const dateMatch = lastDateMessage.text.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const dateStr = dateMatch[0];
        const date = new Date(dateStr);
        const formattedDate = `${date.getFullYear()}년 ${
          date.getMonth() + 1
        }월 ${date.getDate()}일`;

        const confirmMessage: Message = {
          id: Date.now().toString(),
          text: `${formattedDate}부터 ${text} 여행을 계획하시는군요! `,
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        // 여행 인원 질문을 옵션 형태로 수정
        const nextQuestion: Message = {
          id: (Date.now() + 1).toString(),
          text: "누구와 함께 여행하시나요?",
          isBot: true,
          timestamp: new Date().toISOString(),
          options: COMPANION_OPTIONS,
        };

        updateMessages(
          [confirmMessage, nextQuestion],
          "여행 기간은 어떻게 되나요"
        );
        return true;
      }
    }
    return false;
  };

  // 날짜 선택 처리 함수 수정
  const handleConfirm = () => {
    try {
      const formattedStartDate = startDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const formattedEndDate = endDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // 날짜 차이 계산 수정 (당일치기 고려)
      const timeDiff = endDate.getTime() - startDate.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      // 당일치기(시작일 = 종료일)인 경우 0박1일, 아닌 경우 n박(n+1)일
      const nights = days;
      const duration = days === 0 ? "0박1일" : `${nights}박${days + 1}일`;

      const confirmMessage: Message = {
        id: Date.now().toString(),
        text: `${formattedStartDate}부터 ${formattedEndDate}까지 ${duration} 여행을 계획하시는군요!`,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      const nextQuestion: Message = {
        id: (Date.now() + 1).toString(),
        text: "누구와 함께 여행하시나요?",
        isBot: true,
        timestamp: new Date().toISOString(),
        options: COMPANION_OPTIONS,
      };

      updateMessages(
        [confirmMessage, nextQuestion],
        "여행 날짜를 선택해주세요"
      );
      setDatePickerVisible(false);
    } catch (error) {
      console.error("Date handling error:", error);
      Alert.alert("오류", "날짜 처리 중 오류가 발생했습니다.");
    }
  };

  // 메시지 전송 처리
  const handleSendMessage = async (text: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      // ✅ 🔄 일정 재생성 요청 감지 및 AI 일정 생성
      if (text === "새로운 일정을 요청합니다.") {
        const aiResponse = await chatWithAI("새로운 일정을 요청합니다.");

        const aiMessage: Message = {
          id: Date.now().toString(),
          text: `🗓 새로운 일정이 생성되었습니다!\n\n${aiResponse}`,
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        return; // ✅ 여기서 함수 종료
      }

      // 예산 응답 처리
      if (messages.some((msg) => msg.text.includes("여행 예산은 어느 정도"))) {
        // 숫자만 추출하고 만원 단위로 변환
        const budget = text.replace(/[^0-9]/g, "");
        const formattedBudget = `${budget}만원`;

        // AI 응답 메시지
        const confirmMessage: Message = {
          id: Date.now().toString(),
          text: `예산을 ${formattedBudget}으로 설정하셨군요! 👍`,
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        // 다음 질문 (교통수단)
        const nextQuestion: Message = {
          id: (Date.now() + 1).toString(),
          text: "선호하는 교통수단을 선택해주세요 (다수 선택 가능):",
          isBot: true,
          timestamp: new Date().toISOString(),
          styleOptions: [
            { text: "대중교통", value: "public", selected: false },
            { text: "자가용", value: "car", selected: false },
            { text: "택시", value: "taxi", selected: false },
            { text: "걷기", value: "walk", selected: false },
          ],
        };

        // 이전 예산 질문 제거 후 새로운 메시지들 추가
        setMessages((prev) =>
          prev
            .filter((msg) => !msg.text.includes("여행 예산은 어느 정도"))
            .concat([
              {
                id: Date.now().toString(),
                text: formattedBudget,
                isBot: false,
                timestamp: new Date().toISOString(),
              },
              confirmMessage,
              nextQuestion,
            ])
        );

        setIsLoading(false);
        return;
      }

      // 옵션 선택된 경우는 사용자 메시지를 추가하지 않음
      if (!text.endsWith("_selected")) {
        const userMessage: Message = {
          id: Date.now().toString(),
          text,
          isBot: false,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
      } else {
        text = text.replace("_selected", "");
      }

      // 날짜 입력 처리 (예산 질문 이전에만 실행)
      if (
        messages.some((msg) => msg.text.includes("여행 날짜를 선택해주세요")) &&
        !messages.some((msg) => msg.text.includes("여행 기간은 어떻게 되나요"))
      ) {
        showDatePicker();
        setIsLoading(false);
        return;
      }

      // 여행 기간 입력 처리
      if (
        messages.some((msg) => msg.text.includes("여행 기간은 어떻게 되나요"))
      ) {
        const handled = handleTripDuration(text);
        if (handled) {
          setIsLoading(false);
          return;
        }
      }

      // 여행 스타일 선택 처리
      if (
        text.includes("자연") ||
        text.includes("힐링") ||
        text.includes("문화") ||
        text.includes("역사") ||
        text.includes("맛집") ||
        text.includes("쇼핑") ||
        text.includes("액티비티") ||
        text.includes("체험") ||
        text.match(/[1-4][)]/)
      ) {
        // 선택한 스타일 확인 메시지 추가
        const confirmMessage: Message = {
          id: Date.now().toString(),
          text: "알겠습니다. 선택하신 여행 스타일을 참고하겠습니다.",
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        // 다음 질문 메시지
        const nextQuestion: Message = {
          id: (Date.now() + 1).toString(),
          text: "희망하시는 국내 여행지가 있으신가요?",
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        updateMessages(
          [confirmMessage, nextQuestion],
          "여행 스타일을 선택하셨습니다"
        );
        return;
      }

      // 여행지 응답 처리 후 날짜 질문
      if (
        messages.some(
          (msg) => msg.text === "희망하시는 국내 여행지가 있으신가요?"
        )
      ) {
        const confirmMessage: Message = {
          id: Date.now().toString(),
          text: `${text}로 여행을 계획하시는군요! 도와드리겠습니다.`,
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        // 첫 번째 질문 (여행 날짜)
        const nextQuestion: Message = {
          id: (Date.now() + 1).toString(),
          text: "여행 날짜를 선택해주세요.\n시작날짜 먼저 선택후 다음 버튼을 눌러 종료날짜를 선택해주세요.",
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        updateMessages(
          [confirmMessage, nextQuestion],
          "여행지를 선택하셨습니다"
        );
        return;
      }

      // 1번 옵션 선택 시 (기존 일정 등록)
      if (
        text.includes("1") ||
        text.includes("일정") ||
        text.includes("이미") ||
        text.includes("있어") ||
        text.includes("첫번째") ||
        text.includes("1번")
      ) {
        const aiResponse = await chatWithAI(
          "일정에 대해 말씀해 주시면 등록해드리겠습니다."
        );
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: aiResponse,
          isBot: true,
          timestamp: new Date().toISOString(),
        };
        updateMessages([aiMessage]);
      }
      // 2번 옵션 선택 시 (맞춤 일정 추천)
      else if (
        text.includes("2") ||
        text.includes("처음") ||
        text.includes("도와") ||
        text.includes("두번째") ||
        text.includes("2번")
      ) {
        // 여행 스타일 선택 옵션
        const styleOptions: Message = {
          id: Date.now().toString(),
          text: "선호하는 여행 스타일을 선택해주세요 (다수 선택 가능):",
          isBot: true, // 봇 메시지로 설정
          timestamp: new Date().toISOString(),
          styleOptions: [
            { text: "자연", value: "nature", selected: false },
            { text: "힐링", value: "healing", selected: false },
            { text: "액티비티", value: "activity", selected: false },
            { text: "문화", value: "culture", selected: false },
            { text: "체험", value: "experience", selected: false },
            { text: "역사", value: "history", selected: false },
            { text: "쇼핑", value: "shopping", selected: false },
            { text: "맛집", value: "food", selected: false },
          ],
        };
        updateMessages([styleOptions]);
      }
      // 일반 대화
      else {
        const aiResponse = await chatWithAI(text);
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: aiResponse,
          isBot: true,
          timestamp: new Date().toISOString(),
        };
        updateMessages([aiMessage]);
      }

      // 일정 생성 시 이미지도 함께 생성
      if (text.includes("일정 생성") || text.includes("새로운 일정")) {
        try {
          // 1. 먼저 일정 생성
          const aiResponse = await generateTravelSchedule(tripInfo);

          // 2. 여행지 기반으로 이미지 생성
          const destination = tripInfo.destination || "한국 여행";
          const imagePrompt = `Beautiful travel destination photo of ${destination}, scenic view, high quality, 4k`;
          const generatedImage = await generateImage(imagePrompt);

          // 3. 생성된 일정과 이미지를 함께 저장
          const scheduleWithImage = {
            ...JSON.parse(aiResponse),
            image: generatedImage.url, // 생성된 이미지 URL
          };

          // 4. AsyncStorage에 저장
          await AsyncStorage.setItem(
            "formattedSchedule",
            JSON.stringify(scheduleWithImage)
          );

          // 5. AI 응답 메시지 추가
          const aiMessage: Message = {
            id: Date.now().toString(),
            text: `🗓 새로운 일정이 생성되었습니다!\n\n${aiResponse}`,
            isBot: true,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
          console.error("Schedule generation error:", error);
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `죄송합니다. ${
              error.message ||
              "일정 생성 중 오류가 발생했습니다. 다시 시도해주세요."
            }`,
            isBot: true,
            timestamp: new Date().toISOString(),
          };
          updateMessages([errorMessage]);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ⏹ 일정 종료 함수
  const handleExit = () => {
    // ✅ 일정 확정 메시지를 채팅에 추가
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: "✅ 여행일정이 확정되었습니다!",
        isBot: true,
        timestamp: new Date().toISOString(),
      },
    ]);
    setSelectedOption("confirm"); // ✅ 선택한 버튼 스타일 변경
    setShowScheduleButtons(false); // 버튼 숨기기
  };

  //처음부터 다시 시작 버튼 함수
  const handleRestart = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: "네, 처음부터 시작하겠습니다.",
        isBot: true,
        timestamp: new Date().toISOString(),
      },
    ]);

    // 날짜 관련 상태 초기화
    setStartDate(new Date());
    setEndDate(new Date());
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsSelectingEndDate(false);
    setDatePickerVisible(false);
    setDatePickerMode("start");

    // 1.5초 후 초기 메시지로 리셋
    setTimeout(() => {
      setMessages([INITIAL_MESSAGE]);
      setSelectedOptions({});
      setDisabledButtons({});
    }, 1500);

    setShowScheduleButtons(false);
  };

  // 일정 생성 감지
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]; // 마지막 메시지 가져오기

      // 🔹 일정 생성 완료 메시지 감지
      if (
        lastMessage.text.includes("예산 정리") ||
        lastMessage.text.includes("일정이 생성")
      ) {
        setShowScheduleButtons(true);
        setMessages((prev) => {
          if (prev.some((msg) => msg.isLoading)) {
            return prev.filter((msg) => !msg.isLoading);
          }
          return prev;
        });
      }

      // 🔹 새로운 일정 요청 감지 (추가된 코드)
      if (lastMessage.text.includes("새로운 일정을 요청합니다.")) {
        handleSendMessage("새로운 일정을 요청합니다.");
      }
    }
  }, [messages]); // messages 변경될 때마다 실행

  // ✅ 일정이 생성된 후에도 버튼을 계속 표시
  useEffect(() => {
    if (messages.some((msg) => msg.text.includes("일정이 생성되었습니다"))) {
      setShowScheduleButtons(true); // ✅ 일정 생성 후 버튼 다시 활성화
    }
  }, [messages]);

  // 🔄 일정 재생성 함수
  const handleRecreateSchedule = async () => {
    // ✅ 기존 일정 버튼 숨기기
    setShowScheduleButtons(false);
    setSelectedOption(null);

    // ✅ 로딩 메시지 추가
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      isBot: true,
      text: "🔄 AI가 여행 일정을 재생성하고 있습니다...",
      timestamp: new Date().toISOString(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    // ✅ 1초 대기 후 일정 생성 요청 (UI 반영 시간 확보)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // ✅ 기존 사용자 선택 정보 찾기
    const tripInfo = {
      styles: messages
        .find((msg) => msg.text.includes("여행 스타일:"))
        ?.text.split("여행 스타일: ")[1]
        .split("\n")[0]
        .split(", "),
      destination: messages
        .find((msg) => msg.text.includes("여행 지역:"))
        ?.text.split("여행 지역: ")[1]
        .split("\n")[0],
      startDate: selectedStartDate,
      endDate: selectedEndDate,
      duration: `${startDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}부터 ${endDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}까지`,
      companion: messages
        .find((msg) => msg.text.includes("여행 인원:"))
        ?.text.split("여행 인원: ")[1]
        .split("\n")[0],
      budget: messages
        .find((msg) => msg.text.includes("예산:"))
        ?.text.split("예산: ")[1]
        .split("\n")[0],
      transportation: messages
        .find((msg) => msg.text.includes("교통수단:"))
        ?.text.split("교통수단: ")[1]
        .split("\n")[0]
        .split(", "),
    };

    try {
      // ✅ AI 일정 요청
      const aiResponse = await generateTravelSchedule(tripInfo);

      // ✅ AI 응답 메시지 추가 (로딩 메시지 대체)
      setMessages((prev) =>
        prev
          .filter((msg) => !msg.isLoading) // 기존 로딩 메시지 제거
          .concat([
            {
              id: Date.now().toString(),
              text: `🗓 새로운 일정이 생성되었습니다!\n\n${aiResponse}`,
              isBot: true,
              timestamp: new Date().toISOString(),
            },
          ])
      );
      // ✅ 일정이 새로 생성되었으므로 버튼 다시 표시 (0.5초 뒤 실행)
      setTimeout(() => {
        setShowScheduleButtons(true);
      }, 500);
    } catch (error) {
      console.error("❌ 일정 재생성 실패:", error);
      setMessages((prev) =>
        prev
          .filter((msg) => !msg.isLoading) // 기존 로딩 메시지 제거
          .concat([
            {
              id: Date.now().toString(),
              text: "❌ 일정 재생성 중 오류가 발생했습니다. 다시 시도해주세요.",
              isBot: true,
              timestamp: new Date().toISOString(),
            },
          ])
      );
    }
  };

  // 스타일 토글 처리 함수 추가
  const handleStyleToggle = (value: string) => {
    setMessages((prev) => {
      return prev.map((msg) => {
        if (msg.styleOptions) {
          return {
            ...msg,
            styleOptions: msg.styleOptions.map((option) => ({
              ...option,
              selected:
                option.value === value ? !option.selected : option.selected,
            })),
          };
        }
        return msg;
      });
    });
  };

  // 스타일 선택 완료 처리
  const handleStyleSelectComplete = async () => {
    const selectedStyles = messages
      .find((msg) => msg.styleOptions)
      ?.styleOptions?.filter((opt) => opt.selected)
      .map((opt) => opt.text);

    if (selectedStyles && selectedStyles.length > 0) {
      // 교통수단 선택인 경우
      if (
        messages.some((msg) =>
          msg.text.includes("선호하는 교통수단을 선택해주세요")
        )
      ) {
        try {
          // 먼저 사용자의 모든 선택사항을 수집
          const tripInfo: TripInfo = {
            styles: messages
              .find((msg) => msg.text.includes("을(를) 선택하셨네요"))
              ?.text.split("을(를) 선택하셨네요")[0]
              .split(", "),
            destination: messages
              .find((msg) => msg.text.includes("로 여행을 계획하시는군요"))
              ?.text.split("로 여행을")[0],
            startDate: selectedStartDate,
            endDate: selectedEndDate,
            duration: `${startDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}부터 ${endDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}까지`,
            companion: messages
              .find((msg) => msg.text.includes("여행을 준비하겠습니다"))
              ?.text.split(" 여행을")[0],
            budget: messages
              .find((msg) => msg.text.includes("예산을"))
              ?.text.split("예산을 ")[1]
              .split("으로 설정")[0],
            transportation:
              messages
                .find((msg) =>
                  msg.text.includes("선호하는 교통수단을 선택해주세요")
                )
                ?.styleOptions?.filter((opt) => opt.selected)
                .map((opt) => opt.text) || [],
          };

          // 여행 정보를 AsyncStorage에 저장
          await AsyncStorage.setItem("scheduleData", JSON.stringify(tripInfo));

          // 먼저 확인 메시지 표시
          const confirmMessage: Message = {
            id: Date.now().toString(),
            text: `지금까지 선택하신 여행 정보를 정리해드립니다:

• 여행 스타일: ${tripInfo.styles?.join(", ")}
• 여행 지역: ${tripInfo.destination}
• 여행 기간: ${tripInfo.duration}
• 여행 인원: ${tripInfo.companion}
• 예산: ${tripInfo.budget}
• 교통수단: ${tripInfo.transportation?.join(", ")}

이 정보를 바탕으로 일정을 생성해드리겠습니다.`,
            isBot: true,
            timestamp: new Date().toISOString(),
          };

          // 확인 메시지 표시
          updateMessages([confirmMessage]);

          // 잠시 대기 후 로딩 메시지 추가
          setTimeout(() => {
            const loadingMessage: Message = {
              id: `loading-${Date.now()}`,
              isBot: true,
              text: "",
              timestamp: new Date().toISOString(),
              isLoading: true,
            };
            updateMessages([loadingMessage]);
          }, 1000);

          // AI 일정 생성
          const aiResponse = await generateTravelSchedule(tripInfo);

          // 일정 생성 로그
          console.log("=== Travel Schedule Generated ===");
          console.log(
            JSON.stringify(
              {
                timestamp: new Date().toISOString(),
                tripInfo: {
                  startDate: tripInfo.startDate,
                  endDate: tripInfo.endDate,
                  duration: `${tripInfo.nights}박${tripInfo.days}일`,
                  companion: tripInfo.companion,
                  budget: tripInfo.budget,
                  transportation: tripInfo.transportation,
                  preferences: tripInfo.styles,
                },
                generatedSchedule: aiResponse,
                metadata: {
                  userInteractions: messages.filter((m) => !m.isBot).length,
                  generationTime: new Date().toISOString(),
                },
              },
              null,
              2
            )
          );
          console.log("================================");

          // 생성된 일정으로 메시지 교체
          const scheduleMessage: Message = {
            id: Date.now().toString(),
            text: `여행 일정이 생성되었습니다!\n\n${aiResponse}`,
            isBot: true,
            timestamp: new Date().toISOString(),
          };

          updateMessages([scheduleMessage]);
        } catch (error) {
          console.error("Schedule generation error:", error);
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `죄송합니다. ${
              error.message ||
              "일정 생성 중 오류가 발생했습니다. 다시 시도해주세요."
            }`,
            isBot: true,
            timestamp: new Date().toISOString(),
          };
          updateMessages([errorMessage]);
        }

        return;
      }

      // 기존 여행 스타일 선택 처리
      const confirmMessage: Message = {
        id: Date.now().toString(),
        text: `${selectedStyles.join(", ")}을(를) 선택하셨네요. 좋습니다!`,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      const nextQuestion: Message = {
        id: (Date.now() + 1).toString(),
        text: "희망하시는 국내 여행지가 있으신가요?",
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      updateMessages(
        [confirmMessage, nextQuestion],
        "여행 스타일을 선택하셨습니다"
      );
    }
  };

  // DatePicker 관련 함수들
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.role === "assistant";
    const isScheduleGenerated =
      item.content.includes("일정 등록이 완료되었습니다");

    return (
      <>
        <View
          style={[
            styles.messageContainer,
            isAI ? styles.aiMessage : styles.userMessage,
          ]}
        >
          {/* ... 기존 메시지 렌더링 코드 유지 */}
        </View>

        {/* 일정 생성 완료 메시지 다음에 버튼들 표시 */}
        {isScheduleGenerated && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={() => {
                // 마지막 사용자 입력을 기반으로 일정 재생성
                const lastUserMessage = messages
                  .filter((msg) => msg.role === "user")
                  .pop();
                if (lastUserMessage) {
                  handleSendMessage(lastUserMessage.content);
                }
              }}
            >
              <Text style={styles.buttonText}>일정 재생성</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endButton}
              onPress={() => {
                // 채팅 종료 처리
                setMessages([
                  ...messages,
                  {
                    role: "assistant",
                    content:
                      "채팅이 종료되었습니다. 새로운 대화를 시작하시려면 메시지를 입력해주세요.",
                  },
                ]);
              }}
            >
              <Text style={styles.buttonText}>대화 종료</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  // AI 응답 저장을 위한 함수 추가
  const handleAIResponse = (response: string) => {
    // 새로운 AI 응답 객체 생성
    const newResponse: AIResponse = {
      timestamp: new Date().toISOString(),
      message: response,
      type: "ai",
      metadata: {
        location: "현재 위치", // 실제 위치 정보로 대체 필요
        topic: currentTopic, // 현재 대화 주제
        context: "chat", // 컨텍스트 정보
      },
    };

    // 응답 저장
    setAiResponses((prev) => [...prev, newResponse]);

    // 콘솔에 JSON 형식으로 로깅
    console.log("=== New AI Response ===");
    console.log(JSON.stringify(newResponse, null, 2));
    console.log("=====================");

    // 기존 메시지 처리 로직
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: response,
        role: "assistant",
      },
    ]);
  };

  // processMessageToChatGPT 함수 수정
  const processMessageToChatGPT = async (userMessage: string) => {
    try {
      setIsLoading(true);
      const response = await processQuery(userMessage);

      if (response) {
        // AI 응답 처리
        handleAIResponse(response);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      Alert.alert("오류", "메시지 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // formatDate 헬퍼 함수 추가
  const formatDate = (date: Date): string => {
    try {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "날짜 형식 오류";
    }
  };

  const resetChat = () => {
    Alert.alert("대화 초기화", "대화를 처음부터 다시 시작하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "확인",
        onPress: () => {
          setMessages([INITIAL_MESSAGE]);
          setShowOptions(true);
          setDatePickerVisible(false);
          setStartDate(new Date());
          setEndDate(new Date());
          setDatePickerMode("start");
        },
      },
    ]);
  };

  // 오늘 자정으로 설정된 Date 객체 생성
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // DatePicker 부분
  <DateTimePicker
    testID="dateTimePicker"
    value={datePickerMode === "start" ? startDate : endDate}
    mode="date"
    display="inline"
    onChange={(event: DateTimePickerEvent, date?: Date) => {
      if (event.type === "set" && date) {
        if (datePickerMode === "start") {
          // 시작일 선택
          setStartDate(date);
          setSelectedStartDate(date);
          setDatePickerMode("end");
          setEndDate(date); // 시작일과 동일한 날짜로 초기화
        } else {
          // 종료일 선택
          if (date >= selectedStartDate!) {
            setEndDate(date);
            setSelectedEndDate(date);
            handleConfirm();
          } else {
            Alert.alert("알림", "종료일은 시작일과 같거나 이후여야 합니다.");
          }
        }
      }
    }}
    minimumDate={today} // 시작일, 종료일 모두 오늘부터 선택 가능
    locale="ko-KR"
    style={[styles.datePicker, { height: 350 }]}
  />;

  // 날짜 선택 초기화 시 시작일 모드로 설정
  const resetDatePicker = () => {
    setDatePickerMode("start");
    setStartDate(new Date());
    setEndDate(new Date());
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  // DatePicker가 처음 열릴 때 시작일 모드로 설정
  useEffect(() => {
    if (messages.some((msg) => msg.text.includes("여행 날짜를 선택해주세요"))) {
      resetDatePicker();
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>AI 여행 플래너</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={resetChat}>
          <RefreshChatIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.messageList}>
          <MessageList
            messages={messages}
            onOptionSelect={handleOptionSelect}
            onStyleToggle={handleStyleToggle}
            onStyleSelectComplete={handleStyleSelectComplete}
            keyboardShouldPersistTaps="handled"
            handleRecreateSchedule={handleRecreateSchedule}
            handleExit={handleExit}
            handleRestart={handleRestart}
            showScheduleButtons={showScheduleButtons}
            selectedOption={selectedOption}
            setSelectedOptions={setSelectedOptions} // ✅ 추가
            disabledButtons={disabledButtons} // ✅ 추가
            setDisabledButtons={setDisabledButtons} // ✅ 추가
          />
        </View>

        {/* DatePicker를 항상 표시 */}
        {messages.some((msg) =>
          msg.text.includes("여행 날짜를 선택해주세요")
        ) && (
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity
                onPress={() => {
                  // 재선택 시 시작일 선택 모드로 변경하고 날짜 초기화
                  setDatePickerMode("start");
                  setStartDate(new Date());
                  setEndDate(new Date());
                  setSelectedStartDate(null);
                  setSelectedEndDate(null);
                }}
              >
                <Text style={styles.datePickerButton}>재선택</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>
                {datePickerMode === "start" ? "시작일" : "종료일"} 선택
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (datePickerMode === "start") {
                    setDatePickerMode("end");
                    setEndDate(startDate); // 다음날이 아닌 시작일과 동일하게 설정
                  } else {
                    handleConfirm();
                  }
                }}
              >
                <Text style={styles.datePickerButton}>
                  {datePickerMode === "start" ? "다음" : "완료"}
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              testID="dateTimePicker"
              value={datePickerMode === "start" ? startDate : endDate}
              mode="date"
              display="inline"
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                if (event.type === "set" && date) {
                  if (datePickerMode === "start") {
                    // 시작일 선택
                    setStartDate(date);
                    setSelectedStartDate(date);
                    setDatePickerMode("end");
                    setEndDate(date); // 시작일과 동일한 날짜로 초기화
                  } else {
                    // 종료일 선택
                    if (date >= selectedStartDate!) {
                      setEndDate(date);
                      setSelectedEndDate(date);
                      handleConfirm();
                    } else {
                      Alert.alert(
                        "알림",
                        "종료일은 시작일과 같거나 이후여야 합니다."
                      );
                    }
                  }
                }
              }}
              minimumDate={today} // 시작일, 종료일 모두 오늘부터 선택 가능
              locale="ko-KR"
              style={[styles.datePicker, { height: 350 }]}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <MessageInput
            onSend={handleSendMessage}
            disabled={isLoading}
            autoFocus={false}
            style={styles.input}
            returnKeyType="send"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
