import React, { useState, useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { chatWithAI, generateTravelSchedule } from "../api/openai";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { styles } from "../styles/chatScreen";
import { Message, MessageOption } from "../types/chat";
import { INITIAL_MESSAGE, COMPANION_OPTIONS } from "../constants/chat";
import { formatDate, extractTripInfo } from "../utils/messageUtils";
import { Schedule } from "../types/schedule";

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

  // 초기 메시지 설정
  useEffect(() => {
    setMessages([INITIAL_MESSAGE]);
  }, []);

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

      // 다음 질문 (예산)
      const nextQuestion: Message = {
        id: (Date.now() + 2).toString(),
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
          .concat([userMessage, confirmMessage, nextQuestion])
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

    // 여행 기간 계산
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const nights = days - 1;
    const duration = `${nights}박${days}일`;

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

    updateMessages([confirmMessage, nextQuestion], "여행 날짜를 선택해주세요");

    setDatePickerVisible(false);
  };

  // 메시지 전송 처리
  const handleSendMessage = async (text: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

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
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      updateMessages([errorMessage]);
    } finally {
      setIsLoading(false);
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
          const tripInfo = {
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

          // 생성된 일정으로 메시지 교체
          const scheduleMessage: Message = {
            id: Date.now().toString(),
            text: `여행 일정이 생성되었습니다!\n\n${aiResponse}`,
            isBot: true,
            timestamp: new Date().toISOString(),
          };

          updateMessages([scheduleMessage]);
          navigation.navigate("Schedule");
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
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.messageList}>
          <MessageList
            messages={messages}
            onOptionSelect={handleOptionSelect}
            onStyleToggle={handleStyleToggle}
            onStyleSelectComplete={handleStyleSelectComplete}
          />
        </View>

        {/* DatePicker를 항상 표시 */}
        {messages.some((msg) =>
          msg.text.includes("여행 날짜를 선택해주세요")
        ) && (
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={hideDatePicker}>
                <Text style={styles.datePickerButton}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>
                {datePickerMode === "start" ? "시작일" : "종료일"} 선택
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (datePickerMode === "start") {
                    setDatePickerMode("end");
                    setEndDate(
                      new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
                    ); // 다음날로 설정
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
              is24Hour={true}
              display="inline"
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                if (date) {
                  if (datePickerMode === "start") {
                    setStartDate(date);
                  } else {
                    setEndDate(date);
                  }
                }
              }}
              minimumDate={datePickerMode === "start" ? new Date() : startDate}
              locale="ko-KR"
              style={[styles.datePicker, { height: 350 }]}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <MessageInput onSend={handleSendMessage} disabled={isLoading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
