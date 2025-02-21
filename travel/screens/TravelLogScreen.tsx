import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import MenuIcon from "../assets/menu.svg";
import CalendarIcon from "../assets/calendar.svg";
import { getSchedules,getrecord } from "../api/loginapi";
import { Schedule } from "../types/schedule";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TravelLogScreen({ navigation }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      const schedules = await getrecord();
      const schedulesArray = Array.isArray(schedules) ? schedules : [schedules];
      const formattedSchedules: Schedule[] = schedulesArray.map((schedule: any) => ({
        id: schedule.tripId,
        destination: schedule.title,
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        travelStyle: schedule.keywords || [],
        activities: schedule.days ? schedule.days.flatMap((day: any) => day.places.map((place: any) => place.title)) : [],
        budget: schedule.extraInfo ? schedule.extraInfo.totalCost : 0,
        isAIRecommended: false,
        itinerary: schedule.days ? schedule.days.map((day: any) => ({
          date: day.date,
          activities: day.places.map((place: any) => ({
            time: place.time,
            place: place.title,
            description: place.description,
            cost: place.cost,
          })),
        })) : [],
        totalBudget: schedule.extraInfo ? schedule.extraInfo.totalBudget : 0,
        guideService: schedule.extraInfo ? schedule.extraInfo.guideService : false,
      }));
      setSchedules(formattedSchedules);
    } catch (error) {
      console.error("Failed to load schedules from database:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#414B57", "#7987A5", "rgba(154, 173, 196, 1)"]}
        locations={[0.2, 0.715, 0.9237]}
        style={styles.gradient}
      />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <MenuIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Chat")}>
            <CalendarIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {schedules.length > 0 ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {schedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={styles.scheduleCard}
                onPress={() => navigation.navigate("TravelLogDetail", { schedule })}
              >
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
                  onPress={() => navigation.navigate("TravelLogDetail", { schedule })}
                >
                  <Text style={styles.buttonText}>일정 자세히 보기</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    backgroundColor: "#414B57",
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
    height: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48 + 24 + 83,
    paddingTop: 16,
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
  scheduleCard: {
    flex: 1,
    backgroundColor: "#575F6A",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
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
    marginBottom: 4,
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
  detailButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 300,
    marginHorizontal: 24,
    marginBottom: 16,
  },
});
