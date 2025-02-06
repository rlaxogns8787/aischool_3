import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MenuIcon from "../assets/menu.svg";
import SearchIcon from "../assets/search.svg";
import CircularCarouselBannerView from "../components/CircularCarouselBannerView";
import { Schedule } from "../types/schedule";

type ScheduleScreenProps = {
  navigation: any;
};

export default function ScheduleScreen({ navigation }: ScheduleScreenProps) {
  // 테스트용 임시 데이터
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "1",
      destination: "서울",
      startDate: "2024-03-20",
      endDate: "2024-03-22",
      activities: ["경복궁 관람", "남산타워", "인사동 거리"],
      budget: 300000,
      isAIRecommended: true,
      itinerary: [
        {
          date: "2024-03-20",
          activities: [
            {
              time: "10:00",
              place: "경복궁",
              description: "조선의 대표적인 궁궐 관람",
              cost: 3000,
            },
          ],
        },
      ],
    },
    {
      id: "2",
      destination: "부산",
      startDate: "2024-04-01",
      endDate: "2024-04-03",
      activities: ["해운대 해수욕장", "감천문화마을", "자갈치시장"],
      budget: 400000,
      isAIRecommended: false,
      itinerary: [
        {
          date: "2024-04-01",
          activities: [
            {
              time: "11:00",
              place: "해운대",
              description: "해변 산책 및 점심",
              cost: 20000,
            },
          ],
        },
      ],
    },
  ]);

  const renderEmptyState = () => (
    <View style={styles.content}>
      <Image
        source={require("../assets/empty.png")}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>아직 여행 예정되어 있지 않네요</Text>
      <Text style={styles.emptySubtitle}>새로운 여행을 계획해보세요</Text>
    </View>
  );

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={styles.scheduleCard}
      onPress={() => {
        // 일정 상세보기로 이동
        navigation.navigate("ScheduleDetail", { schedule: item });
      }}
    >
      <View style={styles.scheduleHeader}>
        <Text style={styles.destination}>{item.destination}</Text>
        {item.isAIRecommended && (
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>AI 추천</Text>
          </View>
        )}
      </View>
      <Text style={styles.date}>
        {item.startDate} - {item.endDate}
      </Text>
      <View style={styles.activities}>
        {item.activities.slice(0, 3).map((activity, index) => (
          <Text key={index} style={styles.activity}>
            • {activity}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <MenuIcon width={24} height={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchButton}>
          <SearchIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.adContainer}>
        <CircularCarouselBannerView
          onBannerPress={(index) => {
            console.log("Banner pressed:", index);
          }}
        />
      </View>

      {schedules.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scheduleList}
        />
      )}

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => {
          navigation.navigate("Root", {
            screen: "MainTab",
            params: {
              screen: "Tour",
            },
          });
        }}
      >
        <Text style={styles.buttonText}>일정 등록</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  searchButton: {
    padding: 4,
  },
  adContainer: {
    width: "100%",
    height: 88,
    backgroundColor: "#F8F9FF",
  },
  adContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  adImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  adText: {
    position: "absolute",
    top: 16,
    right: 16,
    fontSize: 14,
    color: "#000",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: "#007AFF",
  },
  inactiveDot: {
    backgroundColor: "#D1D1D6",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
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
    backgroundColor: "#007AFF",
    marginHorizontal: 40,
    marginBottom: 90,
    height: 47,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 15,
  },
  scheduleList: {
    padding: 16,
  },
  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  destination: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2024",
  },
  aiTag: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  date: {
    fontSize: 14,
    color: "#71727A",
    marginBottom: 12,
  },
  activities: {
    marginTop: 8,
  },
  activity: {
    fontSize: 14,
    color: "#1F2024",
    marginBottom: 4,
  },
});
