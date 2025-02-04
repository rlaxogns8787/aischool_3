import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import Carousel from "react-native-snap-carousel";
import OptionCard from "./OptionCard";

type Option = {
  text: string;
  value: string;
};

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: Option[];
};

type CardItem = {
  image: string;
  keyword: string;
  title: string;
  address: string;
};

type MessageListProps = {
  messages: Message[];
  onOptionSelect: (option: string) => void;
  showCards: boolean;
  toggleModal: () => void;
};

export default function MessageList({
  messages,
  onOptionSelect,
  showCards,
  toggleModal,
}: MessageListProps) {
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageContainer}>
      <View
        style={[
          styles.messageBubble,
          item.isBot ? styles.botMessage : styles.userMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isBot ? null : styles.userMessageText,
          ]}
        >
          {item.text}
        </Text>
      </View>
      {item.options && (
        <View style={styles.optionsContainer}>
          {item.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => onOptionSelect(option.value)}
            >
              <Text style={styles.optionText}>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderCard = ({ item }: { item: CardItem }) => (
    <OptionCard
      image={item.image}
      keyword={item.keyword}
      title={item.title}
      address={item.address}
      onPress={toggleModal}
    />
  );

  return (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      ListFooterComponent={
        showCards ? (
          <Carousel
            data={[
              {
                image: "../assets/banner1.png",
                keyword: "힐링",
                title: "힐링가득 고궁여행",
                address: "서울중구",
              },
              {
                image: "../assets/banner1.png",
                keyword: "역사",
                title: "역사탐방",
                address: "서울종로구",
              },
            ]}
            renderItem={renderCard}
            sliderWidth={300}
            itemWidth={250}
          />
        ) : null
      }
    />
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
  userMessageText: {
    color: "#FFFFFF",
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: "#fff",
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
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
});
