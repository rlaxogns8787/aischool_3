import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Message } from "../types/message";
import { SearchResult } from "../types/schedule";
import Carousel from "react-native-snap-carousel";
import OptionCard from "./OptionCard";

const { width: screenWidth } = Dimensions.get("window");

type MessageListProps = {
  messages: Message[];
  onOptionSelect: (option: string) => void;
  toggleModal: () => void;
};

export default function MessageList({
  messages,
  onOptionSelect,
  toggleModal,
}: MessageListProps) {
  const flatListRef = useRef<FlatList>(null);

  // 새 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderSearchResult = ({ item: result }: { item: SearchResult }) => (
    <OptionCard
      key={result.id}
      image={result.imageUrl}
      keyword={result.type}
      title={result.name}
      address={result.description}
      onPress={toggleModal}
    />
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <View style={styles.messageContainer}>
      {/* 메시지 버블 */}
      <View
        style={[
          styles.messageBubble,
          item.isBot ? styles.botMessage : styles.userMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isBot ? styles.botMessageText : styles.userMessageText,
          ]}
        >
          {item.text}
        </Text>

        {/* 질문 리스트 */}
        {item.questions && (
          <View style={styles.questionsContainer}>
            {item.questions.map((question, qIndex) => (
              <Text
                key={`${item.id}-q${qIndex}`}
                style={[
                  styles.questionText,
                  item.isBot && styles.botQuestionText,
                ]}
              >
                {question}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* 옵션 버튼 (메시지 버블 외부) */}
      {item.options && (
        <View style={styles.optionsContainer}>
          {item.options.map((option, oIndex) => (
            <TouchableOpacity
              key={`${item.id}-o${oIndex}`}
              style={styles.optionButton}
              onPress={() => onOptionSelect(option.value)}
            >
              <Text style={styles.optionText}>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 검색 결과 카드 */}
      {item.searchResults && item.searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <Carousel
            data={item.searchResults}
            renderItem={renderSearchResult}
            sliderWidth={screenWidth - 32}
            itemWidth={screenWidth - 80}
            activeSlideAlignment="center"
            inactiveSlideScale={0.95}
            inactiveSlideOpacity={0.7}
            containerCustomStyle={styles.carouselContainer}
          />
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  botMessage: {
    backgroundColor: "#F2F2F7",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  botMessageText: {
    color: "#000000",
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  questionsContainer: {
    marginTop: 8,
  },
  questionText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#000000",
  },
  botQuestionText: {
    color: "#000000",
  },
  optionsContainer: {
    marginTop: 8,
    width: "100%",
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
  },
  optionText: {
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
  },
  searchResultsContainer: {
    marginTop: 16,
    width: "100%",
  },
  carouselContainer: {
    marginBottom: 16,
  },
});
