import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import MenuIcon from "../assets/menu.svg";
import CalendarIcon from "../assets/calendar.svg";
import SunIcon from "../assets/sun.svg";
import CloudIcon from "../assets/cloud.svg";
import LocationIcon from "../assets/location.svg";
import TrashIcon from "../assets/trash.svg";
import { Schedule } from "../types/schedule";
import {
  getCurrentWeather,
  getHourlyForecast,
} from "../services/weatherService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_HEIGHT = 44;

type ScheduleScreenProps = {
  navigation: any;
};

export default function ScheduleScreen({ navigation }: ScheduleScreenProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      const storedSchedules = await AsyncStorage.getItem("confirmedSchedule");
      if (storedSchedules) {
        const parsedSchedules = JSON.parse(storedSchedules);
        console.log("Loaded schedules from AsyncStorage:", parsedSchedules); // 디버그용 로그

        // parsedSchedules가 배열이 아닌 경우 배열로 변환
        const schedulesArray = Array.isArray(parsedSchedules)
          ? parsedSchedules
          : [parsedSchedules];

        // Schedule 타입에 맞게 변환
        const formattedSchedules: Schedule[] = schedulesArray.map(
          (schedule: any) => ({
            id: schedule.tripId,
            destination: schedule.title,
            title: schedule.title,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            travelStyle: schedule.travelStyle || schedule.keywords || [],
            activities: schedule.days
              ? schedule.days.flatMap((day: any) =>
                  day.places.map((place: any) => place.title)
                )
              : [],
            budget: schedule.extraInfo ? schedule.extraInfo.totalCost : 0,
            isAIRecommended: false, // AI 추천 여부 정보가 없으므로 임의로 설정
            itinerary: schedule.days
              ? schedule.days.map((day: any) => ({
                  date: day.date,
                  activities: day.places.map((place: any) => ({
                    time: place.time,
                    place: place.title,
                    description: place.description,
                    cost: place.cost,
                  })),
                }))
              : [],
            totalBudget: schedule.extraInfo
              ? schedule.extraInfo.totalBudget
              : 0, // totalBudget 추가
            guideService: schedule.extraInfo
              ? schedule.extraInfo.guideService
              : false, // guideService 추가
          })
        );

        setSchedules(formattedSchedules);
      }
    } catch (error) {
      console.error("Failed to load schedules from AsyncStorage:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const weatherData = await getCurrentWeather("후암동");
        setWeather(weatherData);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError("날씨 정보를 불러오는데 실패했습니다");
        // 임시 날씨 데이터 설정
        setWeather({
          temperature: 21,
          condition: "맑음",
          high: 24,
          low: 13,
          hourly: [
            { time: "9AM", temp: 22, condition: "sunny" },
            { time: "10AM", temp: 23, condition: "sunny" },
            { time: "11AM", temp: 18, condition: "sunny" },
            { time: "12PM", temp: 19, condition: "cloudy" },
            { time: "1PM", temp: 21, condition: "cloudy" },
            { time: "2PM", temp: 22, condition: "cloudy" },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  useEffect(() => {
    const loadWeatherForecast = async () => {
      if (schedules.length > 0) {
        const nextSchedule = schedules[0]; // 가장 가까운 일정
        try {
          // 여행지의 위도/경도 정보가 필요합니다
          const forecast = await getHourlyForecast(
            nextSchedule.latitude,
            nextSchedule.longitude
          );
          setWeatherForecast(forecast);
        } catch (error) {
          console.error("Forecast error:", error);
        }
      }
    };

    loadWeatherForecast();
  }, [schedules]);

  const deleteSchedule = async (id: string) => {
    try {
      const updatedSchedules = schedules.filter(
        (schedule) => schedule.id !== id
      );
      setSchedules(updatedSchedules);
      await AsyncStorage.setItem(
        "confirmedSchedule",
        JSON.stringify(updatedSchedules)
      );
      fetchSchedules(); // 일정 삭제 후 일정 목록 다시 불러오기
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image
        source={require("../assets/empty.png")}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>아직 여행 예정되어 있지 않네요</Text>
      <Text style={styles.emptySubtitle}>새로운 여행을 계획해보세요</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4E7EB8", "#89BBEC", "#9AADC4"]}
        style={styles.gradient}
      />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <MenuIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Chat")}>
            <CalendarIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Weather Info */}
        <View style={styles.weatherContainer}>
          <View style={styles.weatherHeader}>
            <View>
              <View style={styles.locationContainer}>
                <LocationIcon width={16} height={16} color="#FFFFFF" />
                <Text style={styles.location}>{weather?.location}</Text>
              </View>
              <Text style={styles.temperature}>{weather?.temperature}°</Text>
            </View>
            <View style={styles.weatherInfo}>
              <Text style={styles.highLow}>
                H:{weather?.high}° L:{weather?.low}°
              </Text>
            </View>
          </View>

          {/* Hourly Weather */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hourlyWeather}
          >
            {weather?.hourly.map((item, index) => (
              <View key={index} style={styles.hourlyItem}>
                <Text style={styles.hourlyTime}>{item.time}</Text>
                {item.condition === "sunny" ? (
                  <SunIcon width={24} height={24} color="#FFD409" />
                ) : (
                  <CloudIcon width={24} height={24} color="#FFFFFF" />
                )}
                <Text style={styles.hourlyTemp}>{item.temp}°</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Schedule Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {schedules.length > 0
            ? schedules.map((schedule) => (
                <TouchableOpacity
                  key={schedule.id}
                  style={styles.scheduleCard}
                  onPress={() =>
                    navigation.navigate("ScheduleDetail", { schedule })
                  }
                >
                  <View style={styles.scheduleHeader}>
                    {schedule.travelStyle.map((style, index) => (
                      <View key={index} style={styles.styleTag}>
                        <Text style={styles.tagText}>{style}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.scheduleContent}>
                    <View style={styles.scheduleTextContainer}>
                      <Text style={styles.title}>{schedule.title}</Text>
                      <Text style={styles.date}>
                        {schedule.startDate} - {schedule.endDate}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() =>
                      navigation.navigate("ScheduleDetail", { schedule })
                    }
                  >
                    <Text style={styles.buttonText}>일정 자세히 보기</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            : renderEmptyState()}
        </ScrollView>

        {/* 하단 고정 버튼 */}
        {/* <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate("Chat")}
          >
            <Text style={styles.buttonText}>일정 등록</Text>
          </TouchableOpacity>
        </View> */}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4E7EB8",
  },
  gradient: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: "100%",
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    height: HEADER_HEIGHT,
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  weatherContainer: {
    flexDirection: "column",
    padding: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(45px)",
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  temperature: {
    fontSize: 40,
    fontWeight: "300",
    color: "#FFFFFF",
    lineHeight: 56,
  },
  weatherInfo: {
    alignItems: "flex-end",
  },
  highLow: {
    fontSize: 15,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  hourlyWeather: {
    marginTop: 8,
  },
  hourlyItem: {
    alignItems: "center",
    width: 60,
    marginRight: 12,
  },
  hourlyTime: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    width: "100%",
    textAlign: "center",
  },
  hourlyTemp: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48 + 24 + 83, // 버튼 높이(48) + 상단 마진(24) + 하단 탭 높이(83)
    paddingTop: 16, // 날씨 컨테이너와 첫 번째 카드 사이 간격
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
    backgroundColor: "#EAF2FF",
    borderRadius: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2024",
    marginBottom: 8,
    letterSpacing: 0.005 * 18,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#71727A",
    marginBottom: 32,
  },
  registerButton: {
    position: "absolute",
    bottom: 83 + 24, // 하단 탭 높이(83) + 24px 마진
    left: 24,
    right: 24,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "SF Pro Text",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 15,
    textAlign: "center",
    color: "#FFFFFF",
  },
  scheduleList: {
    width: "100%",
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: "rgba(75, 126, 208, 0.3)",
    backdropFilter: "blur(45px)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  scheduleHeader: {
    backgroundColor: "rgba(75, 126, 208, 0.2)",
    padding: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  destination: {
    fontFamily: "SF Pro Text",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 17,
    letterSpacing: -0.01 * 14,
    color: "#FFFFFF",
  },
  aiTag: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
    paddingHorizontal: 8,
    gap: 4,
    height: 24,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
  },
  aiTagText: {
    fontFamily: "SF Pro Text",
    fontWeight: "600",
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    letterSpacing: 0.05 * 10,
    textTransform: "uppercase",
    color: "#FFFFFF",
    paddingHorizontal: 4,
  },
  tagContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  styleTag: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
    paddingHorizontal: 8,
    height: 24,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
  },
  tagText: {
    fontFamily: "SF Pro Text",
    fontWeight: "600",
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    letterSpacing: 0.05 * 10,
    textTransform: "uppercase",
    color: "#FFFFFF",
    paddingHorizontal: 4,
  },
  scheduleContent: {
    padding: 16,
    paddingHorizontal: 24,
  },
  scheduleTextContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "SF Pro Text",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 17,
    letterSpacing: -0.01 * 14,
    color: "#FFFFFF",
    marginBottom: 4, // 제목과 날짜 사이 간격
  },
  date: {
    fontFamily: "SF Pro Text",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 14,
    letterSpacing: -0.01 * 12,
    color: "#FFFFFF",
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: "#FF4D4D",
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  detailButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 300,
    marginHorizontal: 24,
    marginBottom: 16, // 버튼 하단 여백
  },
  bottomButtonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 72,
    backgroundColor: "transparent",
  },
});
