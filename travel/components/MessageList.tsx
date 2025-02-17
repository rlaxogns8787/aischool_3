import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Message } from "../types/message";
import { SearchResult } from "../types/schedule";
import Carousel from "react-native-snap-carousel";
import OptionCard from "./OptionCard";
import OptionModal from "./OptionModal"; // OptionModal import 추가
import StyleToggleButton from "./StyleToggleButton";

const { width: screenWidth } = Dimensions.get("window");

type CardItem = {
  image: { uri: string };
  keyword: string;
  title: string;
  address: string;
};

type MessageListProps = {
  messages: Message[];
  onOptionSelect: (value: number) => void;
  onStyleToggle: (value: string) => void;
  onStyleSelectComplete: () => void;
  toggleModal: () => void;
  handleRecreateSchedule: () => void;
  handleExit: () => void;
  showScheduleButtons: boolean;
  selectedOption: "recreate" | "confirm" | null;
  setSelectedOptions: React.Dispatch<React.SetStateAction<{ [key: string]: "recreate" | "confirm" | null }>>;
  handleRestart: () => void;
  disabledButtons: { [key: string]: boolean };
  setDisabledButtons: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
};

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

const LoadingBubble = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingBubble}>
      <ActivityIndicator color="#007AFF" size="small" style={styles.spinner} />
      <Text style={styles.loadingText}>
        AI가 여행 일정을 생성하고 있습니다...
      </Text>
    </View>
  </View>
);

export default function MessageList({
  messages,
  onOptionSelect,
  onStyleToggle,
  onStyleSelectComplete,
  toggleModal,
  handleRecreateSchedule, // ✅ 반드시 이 이름으로 받기
  handleExit,
  handleRestart,
  showScheduleButtons,
  selectedOption,
}: MessageListProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const handleCardPress = (card: CardItem) => {
    setSelectedCard(card);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCard(null);
  };

  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: "recreate" | "confirm" | "restart" | null }>({});
  const [disabledButtons, setDisabledButtons] = useState<{ [key: string]: boolean }>({});

  // 새 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((message, index) =>
          !message.isLoading ? (
            <View
              key={`message-${message.id}-${index}`}
              style={[
                styles.messageGroup,
                message.isBot ? styles.botGroup : styles.userGroup,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isBot ? styles.botBubble : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isBot ? styles.botText : styles.userText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
              {message.options && (
                <View style={styles.optionsContainer}>
                  {message.options.map((option, optionIndex) => (
                    <OptionButton
                      key={`option-${message.id}-${option.value}-${optionIndex}`}
                      text={option.text}
                      selected={option.selected}
                      onPress={() => onOptionSelect(option.value)}
                    />
                  ))}
                </View>
              )}
              {message.styleOptions && (
                <View style={styles.styleOptionsWrapper}>
                  <View style={styles.styleOptionsContainer}>
                    {message.styleOptions.map((option, optionIndex) => (
                      <StyleToggleButton
                        key={`style-${message.id}-${option.value}-${optionIndex}`}
                        text={option.text}
                        selected={option.selected}
                        onPress={() => onStyleToggle(option.value)}
                      />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={onStyleSelectComplete}
                  >
                    <Text style={styles.completeButtonText}>선택 완료</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* OptionCard 렌더링 */}
              {message.isBot &&
                message.text.includes("여행 일정이 생성되었습니다") && (
                  <OptionCard
                    image="https://cdn.informaticsview.com/news/photo/202408/480_1718_1317.jpg" // 실제 이미지 URL로 변경
                    people="2명"
                    title="여행 일정"
                    date="3박 4일"
                    info="여행 일정이 생성되었습니다. 자세한 내용은 나중에 DB에서 가져올 예정입니다."
                    onPress={() =>
                      handleCardPress({
                        image: {
                          uri: "https://cdn.informaticsview.com/news/photo/202408/480_1718_1317.jpg",
                        },
                        keyword: "여행",
                        title: "여행 일정",
                        address: "3박 4일",
                      })
                    }
                  />
                )}

                {/* ✅ 일정 생성 후 일정 재생성/확정 버튼 표시 */}
                {message.text.includes("일정이 생성되었습니다") && (
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={[styles.optionButton, selectedOptions[message.id] === "recreate" && styles.optionButtonSelected]}
                      onPress={() => {
                        if (!disabledButtons[message.id]) { // 🔹 개별 메시지의 버튼이 비활성화 상태가 아니면 실행
                          handleRecreateSchedule();
                          setSelectedOptions((prev) => ({ ...prev, [message.id]: "recreate" }));
                          setDisabledButtons((prev) => ({ ...prev, [message.id]: true })); // 🔹 해당 메시지 버튼 비활성화
                        }
                      }}
                      disabled={disabledButtons[message.id]} // 🔹 개별 메시지의 버튼을 비활성화
                    >
                      <Text style={[styles.optionText, selectedOptions[message.id] === "recreate" && styles.optionTextSelected]}>
                        일정을 다시 짜주세요
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.optionButton, selectedOptions[message.id] === "confirm" && styles.optionButtonSelected]}
                      onPress={() => {
                        if (!disabledButtons[message.id]) { // 🔹 개별 메시지의 버튼이 비활성화 상태가 아니면 실행
                          handleExit();
                          setSelectedOptions((prev) => ({ ...prev, [message.id]: "confirm" }));
                          setDisabledButtons((prev) => ({ ...prev, [message.id]: true })); // 🔹 해당 메시지 버튼 비활성화
                        }
                      }}
                      disabled={disabledButtons[message.id]} // 🔹 개별 메시지의 버튼을 비활성화
                    >
                      <Text style={[styles.optionText, selectedOptions[message.id] === "confirm" && styles.optionTextSelected]}>
                        일정이 마음에 들어요
                      </Text>
                    </TouchableOpacity>

                    {/* ✅ 추가: 처음부터 다시 할래요 버튼 */}
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        selectedOptions[message.id] === "restart" && styles.optionButtonSelected, // ✅ 선택된 상태일 때 스타일 추가
                      ]}
                      onPress={() => {
                        if (!disabledButtons[message.id]) {
                          handleRestart();  // 기존 handleRestart 호출
                          setSelectedOptions((prev) => ({ ...prev, [message.id]: "restart" })); // ✅ 선택된 옵션으로 'restart' 저장
                          setDisabledButtons((prev) => ({ ...prev, [message.id]: true })); // ✅ 버튼 비활성화
                        }
                      }}
                      disabled={disabledButtons[message.id]} // ✅ 비활성화 적용
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedOptions[message.id] === "restart" && styles.optionTextSelected, // ✅ 텍스트 스타일 변경
                        ]}
                      >
                        처음부터 다시 할래요
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>
          ) : null
        )}

        {/* {messages.some((msg) => msg.isLoading) &&
          !messages.some((msg) =>
            msg.text.includes("여행 일정이 생성되었습니다")
          ) && <LoadingBubble />} */}
        {messages.some((msg) => msg.isLoading) && <LoadingBubble />}

      </ScrollView>
      {selectedCard && (
        <OptionModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          images={[
            {
              uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSt3DCbI2D3dd9d5foUaeITIVjicguWURtF4w&s",
            },
            {
              uri: "https://thumb.pann.com/tc_480/http://fimg5.pann.com/new/download.jsp?FileID=55485262",
            },
            {
              uri: "https://i.pinimg.com/736x/f1/ee/c9/f1eec90d828b0d417e86143daf493261.jpg",
            },
          ]} // 여러 이미지 전달
          themeName={selectedCard.title}
          description={selectedCard.address}
          keywords={[selectedCard.keyword]} // 예시로 키워드 전달
          dayPlans={[
            {
              day: "1일차",
              date: "2.12/월",
              places: [
                {
                  image: {
                    uri: "https://www.heritage.go.kr/gung/gogung1/images/ic-c1.jpg",
                  },
                  name: "경복궁",
                  address: "서울 중구",
                  duration: "29분 소요",
                },
                {
                  image: {
                    uri: "https://heritage.unesco.or.kr/wp-content/uploads/2019/04/hd6_393_i1.jpg",
                  },
                  name: "창덕궁",
                  address: "서울 종로구",
                  duration: "45분 소요",
                },
                {
                  image: {
                    uri: "https://upload.wikimedia.org/wikipedia/commons/3/35/%EB%8D%95%EC%88%98%EA%B6%81.jpg",
                  },
                  name: "덕수궁",
                  address: "서울 중구",
                  duration: "30분 소요",
                },
              ],
            },
            {
              day: "2일차",
              date: "2.13/화",
              places: [
                {
                  image: {
                    uri: "https://cdn.pixabay.com/photo/2022/09/16/17/08/namsan-tower-7459178_640.jpg",
                  },
                  name: "남산타워",
                  address: "서울 용산구",
                  duration: "45분 소요",
                },
                {
                  image: {
                    uri: "https://cdn.pixabay.com/photo/2014/04/17/05/16/myeongdong-326136_640.jpg",
                  },
                  name: "명동",
                  address: "서울 중구",
                  duration: "1시간 소요",
                },
                {
                  image: {
                    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrQr8t3KCKCw8qbz1kKg44Ls_ZAT1hpAtKPQ&s",
                  },
                  name: "동대문",
                  address: "서울 중구",
                  duration: "1시간 30분 소요",
                },
              ],
            },
            // 다른 일차들 추가
          ]}
          onShare={() => {}}
          onPlacePress={() => {}}
          onShareWithColleagues={() => {}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
  },
  messageGroup: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 16,
  },
  botBubble: {
    backgroundColor: "#F2F2F7",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: "#000000",
  },
  userText: {
    color: "#FFFFFF",
  },
  optionsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  optionButton: {
    borderRadius: 20,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  optionButtonSelected: {
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 20, // 스크롤 여백
  },
  styleOptionsWrapper: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  styleOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  completeButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "stretch",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    padding: 12,
    borderRadius: 20,
    maxWidth: "80%",
  },
  spinner: {
    marginRight: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  recreateButton: {
    backgroundColor: "#F2F2F7", // ✅ 기존 옵션 스타일의 회색 배경
    borderColor: "#D1D1D6", // ✅ 기존 옵션 스타일과 동일한 테두리
  },
  exitButton: {
    backgroundColor: "#007AFF", // ✅ 기존 옵션 스타일의 파란색 배경
    borderColor: "#007AFF",
  },
});
