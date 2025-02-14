import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

type OptionCardProps = {
  image: string;
  people: string; // 여행인원
  title: string; // 여행제목
  date: string; // 여행 기간
  info: string; // 정보
  onPress: () => void;
};

const OptionCard: React.FC<OptionCardProps> = ({
  image,
  people,
  title,
  date,
  info,
  onPress,
}) => {
  return (
    <View>
      <View style={styles.card}>
        <Image source={{ uri: image }} style={styles.image} />
        <View style={styles.peopleContainer}>
          <Text style={styles.people}>{people}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.info}>{info}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>상세보기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F9FE",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
    margin: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 150,
  },
  peopleContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    padding: 5,
  },
  people: {
    color: "#fff",
    fontSize: 12,
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  info: {
    fontSize: 14,
    color: "#666",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    margin: 10,
    width: "80%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default OptionCard;
