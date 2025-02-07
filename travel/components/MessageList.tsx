import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { Message } from "../types/message";
import { SearchResult } from "../types/schedule";
import Carousel from "react-native-snap-carousel";
import OptionCard from "./OptionCard";
import StyleToggleButton from "./StyleToggleButton";

const { width: screenWidth } = Dimensions.get("window");

type MessageListProps = {
  messages: Message[];
  onOptionSelect: (value: number) => void;
  onStyleToggle: (value: string) => void;
  onStyleSelectComplete: () => void;
  toggleModal: () => void;
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

export default function MessageList({
  messages,
  onOptionSelect,
  onStyleToggle,
  onStyleSelectComplete,
  toggleModal,
}: MessageListProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // 새 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      onContentSizeChange={() =>
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }
    >
      {messages.map((message, index) => (
        <View
          key={`message-${message.id}-${index}`}
          style={styles.messageGroup}
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
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    textAlign: "left",
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
});
