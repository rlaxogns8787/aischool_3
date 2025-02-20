import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Schedule } from "../types/schedule";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import TrashIcon from "../assets/trash.svg";
import { deleteSchedule as deleteScheduleAPI, getSchedules } from "../api/loginapi";

type RouteParams = {
  ScheduleDetail: {
    schedule: Schedule;
  };
};

export default function ScheduleDetail() {
  const route = useRoute<RouteProp<RouteParams, "ScheduleDetail">>();
  const navigation = useNavigation();
  const { schedule } = route.params;

  const deleteSchedule = async (id: string) => {
    Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteScheduleAPI(id);
            navigation.goBack();
          } catch (error) {
            console.error("Failed to delete schedule:", error);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const schedules = await getSchedules();
        // Handle the fetched schedules as needed
      } catch (error) {
        console.error("Failed to fetch schedules:", error);
      }
    };

    fetchSchedules();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 일정</Text>
        <TouchableOpacity
          onPress={() => deleteSchedule(schedule.id || schedule.tripId)}
        >
          <TrashIcon width={24} height={24} color="#FF4D4D" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.destinationSection}>
          <Text style={styles.destination}>{schedule.destination}</Text>
          <Text style={styles.date}>
            {schedule.startDate} - {schedule.endDate}
          </Text>
        </View>

        {schedule.itinerary.map((day, index) => (
          <View key={index} style={styles.daySection}>
            <Text style={styles.dayTitle}>{day.date}</Text>
            {day.activities.map((activity, actIndex) => (
              <View key={actIndex} style={styles.activity}>
                <Text style={styles.time}>{activity.time}</Text>
                <View style={styles.activityContent}>
                  <Text style={styles.place}>{activity.place}</Text>
                  <Text style={styles.description}>{activity.description}</Text>
                  {activity.cost > 0 && (
                    <Text style={styles.cost}>
                      ₩{activity.cost.toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  destinationSection: {
    marginBottom: 24,
  },
  destination: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2024",
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: "#71727A",
  },
  daySection: {
    marginBottom: 24,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2024",
    marginBottom: 16,
  },
  activity: {
    flexDirection: "row",
    marginBottom: 16,
  },
  time: {
    width: 60,
    fontSize: 14,
    color: "#71727A",
  },
  activityContent: {
    flex: 1,
    marginLeft: 16,
  },
  place: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2024",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#71727A",
    marginBottom: 4,
  },
  cost: {
    fontSize: 14,
    color: "#007AFF",
  },
});
