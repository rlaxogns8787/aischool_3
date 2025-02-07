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

const { width: screenWidth } = Dimensions.get("window");

type MessageListProps = {
  messages: Message[];
  onOptionSelect: (option: string) => void;
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
    <View style={styles.messageGroup}>
      <View
        style={[
          styles.messageBubble,
          item.isBot ? styles.botBubble : styles.userBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isBot ? styles.botText : styles.userText,
          ]}
        >
          {item.text}
        </Text>
      </View>
      {item.options && (
        <View style={styles.optionsContainer}>
          {item.options.map((option) => (
            <OptionButton
              key={option.value}
              text={option.text}
              selected={option.selected}
              onPress={() => onOptionSelect(option.value)}
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {messages.map((message) => (
        <View key={message.id} style={styles.messageGroup}>
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
              {message.options.map((option) => (
                <OptionButton
                  key={option.value}
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
});
