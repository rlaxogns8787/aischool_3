import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mic, MessageCircle } from "lucide-react-native";
import MenuIcon from "../assets/menu.svg";
import NotificationIcon from "../assets/bell.svg";

type HomeScreenProps = {
  navigation: any;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  // 사용자 이름은 나중에 Context에서 가져올 예정
  const userName = "길동님";

  const handleMicPress = () => {
    navigation.navigate("Chat"); // Chat 스크린으로 이동
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <MenuIcon width={24} height={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton}>
          <NotificationIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <Text style={styles.greeting}>
            안녕하세요 {userName},{"\n"}
            오늘은 어디로 떠나볼까요?
          </Text>

          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress} // 마이크 버튼 클릭 핸들러 추가
          >
            <Mic size={32} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
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
  notificationButton: {
    padding: 4,
  },
  contentWrapper: {
    flex: 1,
    position: "relative",
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 36,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
});
