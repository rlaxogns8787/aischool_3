import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Schedule } from "../types/schedule";

type ScheduleDetailProps = {
  navigation: any;
  route: {
    params: {
      schedule: Schedule;
    };
  };
};

export default function ScheduleDetail({
  navigation,
  route,
}: ScheduleDetailProps) {
  const { schedule } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 일정</Text>
        <View style={{ width: 24 }} />
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
                  {activity.cost && (
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
