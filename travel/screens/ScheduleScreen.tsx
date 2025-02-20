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
// import SunIcon from "../assets/sun.svg";
// import CloudIcon from "../assets/cloud.svg";
// import LocationIcon from "../assets/location.svg";
import TrashIcon from "../assets/trash.svg";
import { Schedule } from "../types/schedule";
import {
  getCurrentWeather,
  getHourlyForecast,
} from "../services/weatherService";
import { getSchedules } from "../api/loginapi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_HEIGHT = 44;

type ScheduleScreenProps = {
  navigation: any;
};

export default function ScheduleScreen({ navigation }: ScheduleScreenProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  // const [weather, setWeather] = useState<any>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [weatherForecast, setWeatherForecast] = useState<any[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      // 데이터베이스에서 일정을 가져옵니다.
      const schedules = await getSchedules(); // AsyncStorage 대신 getSchedules 호출
      console.log("Fetched schedules:", schedules); // 추가된 로그

      // schedules가 배열이 아닌 경우 배열로 변환
      const schedulesArray = Array.isArray(schedules)
        ? schedules // 이미 배열인 경우 그대로 사용
        : [schedules]; // 배열이 아닌 경우 배열로 감싸서 사용

      // Schedule 타입에 맞게 변환
      const formattedSchedules: Schedule[] = schedulesArray.map(
        (schedule: any) => ({
          id: schedule.tripId, // 일정의 고유 ID
          destination: schedule.title, // 목적지 정보 (제목으로 설정)
          title: schedule.title, // 일정 제목
          startDate: schedule.startDate, // 시작 날짜
          endDate: schedule.endDate, // 종료 날짜
          travelStyle: schedule.keywords, // 여행 스타일 (키워드)
          activities: schedule.days
            ? schedule.days.flatMap((day: any) =>
                day.places.map((place: any) => place.title) // 각 날의 활동 제목을 평면화하여 배열로 만듭니다.
              )
            : [], // 일정이 없는 경우 빈 배열 반환
          budget: schedule.extraInfo ? schedule.extraInfo.totalCost : 0, // 예산 정보 (총 비용)
          isAIRecommended: false, // AI 추천 여부 (기본값 false)
          itinerary: schedule.days
            ? schedule.days.map((day: any) => ({
                date: day.date, // 날짜
                activities: day.places.map((place: any) => ({
                  time: place.time, // 활동 시간
                  place: place.title, // 장소 제목
                  description: place.description, // 장소 설명
                  cost: place.cost, // 비용
                })),
              }))
            : [], // 일정이 없는 경우 빈 배열 반환
          totalBudget: schedule.extraInfo
            ? schedule.extraInfo.totalBudget
            : 0, // 총 예산 정보 (기본값 0)
          guideService: schedule.extraInfo
            ? schedule.extraInfo.guideService
            : false, // 가이드 서비스 여부 (기본값 false)
        })
      );

      // 변환된 일정을 상태에 저장
      setSchedules(formattedSchedules);

    } catch (error) {
      // 에러 발생 시 콘솔에 에러 메시지 출력
      console.error("Failed to load schedules from database:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  // useEffect(() => {
  //   const fetchWeather = async () => {
  //     try {
  //       setIsLoading(true);
  //       setError(null);
  //       const weatherData = await getCurrentWeather("후암동");
  //       setWeather(weatherData);
  //     } catch (err) {
  //       console.error("Weather fetch error:", err);
  //       setError("날씨 정보를 불러오는데 실패했습니다");
  //       // 임시 날씨 데이터 설정
  //       setWeather({
  //         temperature: 21,
  //         condition: "맑음",
  //         high: 24,
  //         low: 13,
  //         hourly: [
  //           { time: "9AM", temp: 22, condition: "sunny" },
  //           { time: "10AM", temp: 23, condition: "sunny" },
  //           { time: "11AM", temp: 18, condition: "sunny" },
  //           { time: "12PM", temp: 19, condition: "cloudy" },
  //           { time: "1PM", temp: 21, condition: "cloudy" },
  //           { time: "2PM", temp: 22, condition: "cloudy" },
  //         ],
  //       });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchWeather();
  // }, []);

  // useEffect(() => {
  //   const loadWeatherForecast = async () => {
  //     if (schedules.length > 0) {
  //       const nextSchedule = schedules[0]; // 가장 가까운 일정
  //       try {
  //         // 여행지의 위도/경도 정보가 필요합니다
  //         const forecast = await getHourlyForecast(
  //           nextSchedule.latitude,
  //           nextSchedule.longitude
  //         );
  //         setWeatherForecast(forecast);
  //       } catch (error) {
  //         console.error("Forecast error:", error);
  //       }
  //     }
  //   };

  //   loadWeatherForecast();
  // }, [schedules]);



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

        {schedules.length > 0 ? (
          <>
            {/* Weather Info */}
            {/*
            <View style={styles.weatherContainer}>
              <View style={styles.weatherHeader}>
                <View>
                  <View style={styles.locationContainer}>
                    <LocationIcon width={16} height={16} color="#FFFFFF" />
                    <Text style={styles.location}>{weather?.location}</Text>
                  </View>
                  <Text style={styles.temperature}>
                    {weather?.temperature}°
                  </Text>
                </View>
                <View style={styles.weatherInfo}>
                  <Text style={styles.highLow}>
                    H:{weather?.high}° L:{weather?.low}°
                  </Text>
                </View>
              </View>

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
            */}

            {/* Schedule Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {schedules.map((schedule) => (
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
              ))}
            </ScrollView>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyTitle}>여행 기록이 아직 없네요</Text>
                <Text style={styles.emptySubtitle}>
                  어디론가 떠나보는게 어떨까요?
                </Text>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate("Chat")}
              >
                <Text style={styles.buttonText}>일정 등록</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  // weatherContainer: {
  //   flexDirection: "column",
  //   padding: 20,
  //   paddingBottom: 16,
  //   backgroundColor: "rgba(0, 0, 0, 0.1)",
  //   backdropFilter: "blur(45px)",
  // },
  // weatherHeader: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "flex-start",
  //   marginBottom: 8,
  // },
  // locationContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 4,
  // },
  // location: {
  //   fontSize: 14,
  //   fontWeight: "500",
  //   color: "#FFFFFF",
  // },
  // temperature: {
  //   fontSize: 40,
  //   fontWeight: "300",
  //   color: "#FFFFFF",
  //   lineHeight: 56,
  // },
  // weatherInfo: {
  //   alignItems: "flex-end",
  // },
  // highLow: {
  //   fontSize: 15,
  //   color: "#FFFFFF",
  //   opacity: 0.8,
  // },
  // hourlyWeather: {
  //   marginTop: 8,
  // },
  // hourlyItem: {
  //   alignItems: "center",
  //   width: 60,
  //   marginRight: 12,
  // },
  // hourlyTime: {
  //   color: "#FFFFFF",
  //   fontSize: 12,
  //   fontWeight: "500",
  //   marginBottom: 4,
  //   width: "100%",
  //   textAlign: "center",
  // },
  // hourlyTemp: {
  //   color: "#FFFFFF",
  //   fontSize: 14,
  //   fontWeight: "500",
  //   marginTop: 4,
  // },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48 + 24 + 83, // 버튼 높이(48) + 상단 마진(24) + 하단 탭 높이(83)
    paddingTop: 16, // 날씨 컨테이너와 첫 번째 카드 사이 간격
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
    letterSpacing: 0.005 * 18,
    textAlign: "center",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.8)",
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 72,
  },
  registerButton: {
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
