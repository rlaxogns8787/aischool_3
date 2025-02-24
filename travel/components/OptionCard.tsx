import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRandomKoreaImage } from "../utils/imageUtils";
import Svg, { SvgProps } from "react-native-svg"; // SVG 렌더링을 위한 라이브러리 추가
import EmptyImage from "../assets/Image.svg"; // 기본 이미지 추가
import defaultTravelImage from "../assets/default-travel-1.jpg"; // 기본 이미지 import

type OptionCardProps = {
  onPress: () => void;
};

const OptionCard: React.FC<OptionCardProps> = ({ onPress }) => {
  const [schedule, setSchedule] = useState<any>(null);
  const [randomImage, setRandomImage] = useState<any>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      const storedSchedule = await AsyncStorage.getItem("formattedSchedule");
      if (storedSchedule) {
        setSchedule(JSON.parse(storedSchedule));
      }
    };
    fetchSchedule();
    // 랜덤 이미지 설정
    setRandomImage(getRandomKoreaImage());
  }, []);

  useEffect(() => {
    const updateSchedule = async () => {
      const storedSchedule = await AsyncStorage.getItem("formattedSchedule");
      if (storedSchedule) {
        setSchedule(JSON.parse(storedSchedule));
      }
    };
    updateSchedule();
  }, [schedule]);

  if (!schedule) {
    return null;
  }

  // places 배열의 title 값을 추출하여 info 텍스트로 설정
  const placeTitles = schedule.days
    .flatMap((day: any) => day.places)
    .map((place: any) => place.title)
    .join(", ");

  return (
    <View>
      <View style={styles.card}>
        <Image source={randomImage} style={styles.image} />
        <View style={styles.companionContainer}>
          <Text style={styles.companion}>{schedule.companion}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{schedule.title}</Text>
          <Text style={styles.duration}>{schedule.duration}</Text>
          <Text style={styles.info} numberOfLines={1} ellipsizeMode="tail">
            {placeTitles}
          </Text>
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
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
    margin: 10,
    overflow: "hidden",
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#D4D6DD",
    width: "90%",
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  companionContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#007AFF",
    borderRadius: 18,
    padding: 10,
  },
  companion: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  duration: {
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
    borderRadius: 40,
    alignItems: "center",
    margin: 8,
    width: "90%",
    height: 40,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default OptionCard;
