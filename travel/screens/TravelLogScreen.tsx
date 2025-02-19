import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MenuIcon from "../assets/menu.svg";
import CalendarIcon from "../assets/calendar.svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TravelLogScreen({ navigation }) {
  return (
    <LinearGradient
      colors={["#414B57", "#7987A5", "rgba(154, 173, 196, 1)"]}
      locations={[0.2, 0.715, 0.9237]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <MenuIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Chat")}>
            <CalendarIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
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
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    opacity: 0.8,
  },
  safeArea: {
    flex: 1,
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
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    marginTop: -100,
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
    lineHeight: 13,
    textAlign: "center",
    color: "#FFFFFF",
  },
});
