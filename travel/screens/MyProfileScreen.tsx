import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Camera } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import * as ImagePicker from "expo-image-picker";
import { TERMS_CONTENT } from "../screens/AgreementScreen";

interface UserInfo {
  username: string;
  nickname: string;
  birthyear: number;
  gender: string;
}

type MyProfileScreenProps = {
  navigation: DrawerNavigationProp<any>;
};

export default function MyProfileScreen({ navigation }: MyProfileScreenProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    loadUserInfo();

    // 화면에 포커스될 때마다 사용자 정보 새로고침
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserInfo();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        setUserInfo(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const handleImagePick = async () => {
    try {
      // iOS 13+ 에서는 권한 요청이 필요 없음
      if (Platform.OS !== "ios") {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        // TODO: 이미지 업로드 API 호출
        Alert.alert("성공", "프로필 이미지가 변경되었습니다.");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("오류", "이미지 선택 중 문제가 발생했습니다.");
    }
  };

  const handleEditField = (field: string, currentValue?: string) => {
    if (field === "password") {
      navigation.navigate("EditProfile", { field });
    } else {
      navigation.navigate("EditProfile", { field, currentValue });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>마이프로필</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileImageSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar} />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleImagePick}
            >
              <Camera size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>계정 정보</Text>
          <View style={styles.infoItem}>
            <Text style={styles.label}>이메일</Text>
            <Text style={styles.value}>{userInfo?.username || "{email}"}</Text>
          </View>
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => handleEditField("nickname", userInfo?.nickname)}
          >
            <Text style={styles.label}>닉네임</Text>
            <Text style={styles.value}>
              {userInfo?.nickname || "{nickname}"}
            </Text>
            <ChevronLeft
              size={20}
              color="#C7C7CC"
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() =>
              handleEditField("birthyear", userInfo?.birthyear?.toString())
            }
          >
            <Text style={styles.label}>생년월일</Text>
            <Text style={styles.value}>{userInfo?.birthyear || "2000"}</Text>
            <ChevronLeft
              size={20}
              color="#C7C7CC"
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => handleEditField("gender", userInfo?.gender)}
          >
            <Text style={styles.label}>성별</Text>
            <Text style={styles.value}>
              {userInfo?.gender === "Female" ? "여자" : "남자"}
            </Text>
            <ChevronLeft
              size={20}
              color="#C7C7CC"
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>계정 보안</Text>
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => handleEditField("password")}
          >
            <Text style={styles.label}>비밀번호 변경</Text>
            <ChevronLeft
              size={20}
              color="#C7C7CC"
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 40,
  },
  content: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: "center",
    padding: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: "#EAF2FF",
  },
  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#007AFF",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  value: {
    fontSize: 16,
    color: "#8E8E93",
    marginRight: 8,
  },
});
