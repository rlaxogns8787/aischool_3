import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

type OptionCardProps = {
  image: string;
  keyword: string;
  title: string;
  address: string;
  onPress: () => void;
};

const OptionCard: React.FC<OptionCardProps> = ({
  image,
  keyword,
  title,
  address,
  onPress,
}) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.keywordContainer}>
        <Text style={styles.keyword}>{keyword}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.address}>{address}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>일정 선택</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
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
  keywordContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    padding: 5,
  },
  keyword: {
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
  address: {
    fontSize: 14,
    color: "#666",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    margin: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default OptionCard;
