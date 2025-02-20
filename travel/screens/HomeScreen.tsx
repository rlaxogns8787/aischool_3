import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import MenuIcon from "../assets/menu.svg";
import CalendarIcon from "../assets/calendar.svg";
import FlyArrowIcon from "../assets/flyarrow.svg";
import LocationIcon from "../assets/location.svg";
import {
  getCurrentWeather,
  type WeatherData,
} from "../services/weatherService";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { getSchedules } from "../api/loginapi";

// 임시 데이터
const scheduleData = {
  travelStyle: ["맛집", "힐링", "역사"],
  startDate: new Date(),
  title: "맛 따라 걷는 후암동, 한입에 설레는 남산 뷰",
};

// 날씨 관련 랜덤 텍스트 배열
const WEATHER_PHRASES = [
  "미세먼지 걱정 없는",
  "화창한 하늘 아래",
  "구름 한 점 없는 맑은",
  "선선한 바람이 부는",
  "따뜻한 햇살이 가득한",
  "시원한 공기가 감도는",
  "상쾌한 공기 가득한",
  "푸른 하늘이 펼쳐진",
  "바람이 살랑이는",
  "포근한 바람이 부는",
  "가볍게 걷기 좋은",
  "맑은 공기가 가득한",
  "기분 좋은 바람이 부는",
  "여행하기 좋은 날씨인",
];

type RootStackParamList = {
  Chat: undefined;
  Schedule: undefined;
  Tour: undefined;
};

type HomeScreenNavigationProp = NavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HEADER_HEIGHT = 44; // 일관된 높이값 설정
const CARD_WIDTH = 344;
const CARD_HEIGHT = 124;
const BOTTOM_TAB_HEIGHT = 83; // 하단 탭 메뉴 높이

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherPhrase, setWeatherPhrase] = useState("");
  const [schedule, setSchedule] = useState<any>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * WEATHER_PHRASES.length);
    setWeatherPhrase(WEATHER_PHRASES[randomIndex]);
  }, []);

  useEffect(() => {
    async function loadWeatherData() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("위치 권한이 필요합니다");
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const weatherData = await getCurrentWeather(
          location.coords.latitude,
          location.coords.longitude
        );

        setWeather(weatherData);
      } catch (err) {
        setError("날씨 정보를 가져오는데 실패했습니다");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWeatherData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      async function loadScheduleData() {
        try {
          const scheduleData = await getSchedules();
          if (!scheduleData || scheduleData.length === 0) {
            setSchedule(null); // scheduleData가 없을 경우 null로 설정
            return;
          }
          // 변환: keywords 데이터를 travelStyle로 변환
          const transformedScheduleData = {
            ...scheduleData[0],
            travelStyle: scheduleData[0].keywords || [], // keywords가 없는 경우 빈 배열 반환
          };
          setSchedule(transformedScheduleData);
        } catch (error) {
          console.error("Failed to load schedule from database:", error);
          setSchedule(null); // 에러 발생 시 schedule을 null로 설정
        }
      }

      loadScheduleData();
    }, [])
  );

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <ImageBackground
      source={require("../assets/images/sky.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.headerIcon}
          >
            <MenuIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Chat")}
            style={styles.headerIcon}
          >
            <CalendarIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>
            {weatherPhrase},{"\n"}오늘은 어디로 떠나볼까요?
          </Text>

          {/* Weather Info */}
          <View style={styles.weatherInfo}>
            {isLoading ? (
              <ActivityIndicator size="large" color="white" />
            ) : error ? (
              <>
                <View style={styles.locationContainer}>
                  <LocationIcon width={16} height={16} color="#FFFFFF" />
                  <Text style={styles.location}>서울 잠실동</Text>
                </View>
                <Text style={styles.temperature}>24°</Text>
                <Text style={styles.weatherCondition}>맑음</Text>
                <Text style={styles.tempRange}>최고 27° / 최저 19°</Text>
              </>
            ) : weather ? (
              <>
                <View style={styles.locationContainer}>
                  <LocationIcon width={16} height={16} color="#FFFFFF" />
                  <Text style={styles.location}>{weather.location}</Text>
                </View>
                <Text style={styles.temperature}>{weather.temperature}°</Text>
                <Text style={styles.weatherCondition}>{weather.condition}</Text>
                <Text style={styles.tempRange}>최고 {weather.high}° / 최저 {weather.low}°</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Travel Card - 일정이 있을 때만 표시 */}
        {schedule && schedule.tripId ? (
          <View style={styles.travelCardContainer}>
            <View style={styles.travelCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.timeLabel}>
                  {isToday(new Date(schedule.startDate))
                    ? "오늘 예정"
                    : formatDate(new Date(schedule.startDate))}
                </Text>
                <View style={styles.travelStyleContainer}>
                  {(schedule.travelStyle || [])
                    .slice(0, 3)
                    .map((style: string, index: number) => (
                      <View key={index} style={styles.styleTag}>
                        <Text style={styles.tagText}>{style}</Text>
                      </View>
                    ))}
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{schedule.title}</Text>
                <TouchableOpacity
                  style={styles.arrowButton}
                  onPress={() => {
                    navigation.navigate("Tour");
                  }}
                >
                  <FlyArrowIcon width={20} height={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}></Text>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  safeArea: {
    flex: 1,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
    marginTop: 40,
    lineHeight: 40,
  },
  weatherInfo: {
    marginTop: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontFamily: "SF Pro Text",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18,
    color: "#FFFFFF",
  },
  temperature: {
    fontSize: 72,
    fontWeight: "200",
    color: "#fff",
    marginTop: 10,
  },
  weatherPhrase: {
    fontSize: 16,
    color: "#fff",
    marginTop: 5,
    opacity: 0.8,
  },
  filterContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 10,
  },
  activeFilterTab: {
    backgroundColor: "#fff",
  },
  filterText: {
    color: "#fff",
    fontSize: 16,
  },
  activeFilterText: {
    color: "#007AFF",
  },
  travelCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: "center",
    marginBottom: 114,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    height: 44,
    backgroundColor: "rgba(75, 126, 208, 0.5)",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  travelStyleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  timeLabel: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "500",
    letterSpacing: -0.01,
    color: "#FFFFFF",
    textTransform: "lowercase",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    height: 80,
    backgroundColor: "rgba(75, 126, 208, 0.3)",
    backdropFilter: "blur(45px)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "700",
    letterSpacing: -0.01,
    color: "#FFFFFF",
    marginRight: 72,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  travelCardContainer: {
    paddingHorizontal: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 16,
  },
  weatherCondition: {
    fontSize: 18,
    fontWeight: "500",
    color: "#fff",
    marginTop: 5,
  },
  tempRange: {
    fontSize: 14,
    fontWeight: "400",
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },  
});
