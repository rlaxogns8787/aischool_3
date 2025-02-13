import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { X, ChevronRight } from "lucide-react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { CommonActions } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { TERMS_CONTENT } from "../screens/AgreementScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserInfo {
  nickname: string;
  username: string;
  birthyear: number;
  gender: string;
  marketing_consent: boolean;
}

export default function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const { navigation } = props;
  const { signOut } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
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

    loadUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Auth" }],
        })
      );
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    }
  };

  const menuItems = [
    { label: "알림 설정", onPress: () => {} },
    { label: "문의하기", onPress: () => {} },
    { label: "공지사항", onPress: () => {} },
    {
      label: "이용약관",
      onPress: () => {
        navigation.navigate("TermsDetail", {
          title: "이용약관",
          content: TERMS_CONTENT.service,
          showHeader: true,
        });
      },
    },
    {
      label: "개인정보 처리방침",
      onPress: () => {
        navigation.navigate("Agreement", {
          showHeader: true,
        });
      },
    },
    { label: "사용 가이드", onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.closeDrawer()}
          style={styles.closeButton}
        >
          <X size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileContent}>
          <TouchableOpacity
            style={styles.profileContent}
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate("MyProfile");
            }}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>
                {userInfo?.nickname || "{nickname}"}
              </Text>
              <Text style={styles.editProfile}>프로필 편집</Text>
            </View>
            <ChevronRight size={32} color="#C5C6CC" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.menuSection}>
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 305,
    backgroundColor: "#F7F7F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 54,
    paddingRight: 16,
    paddingBottom: 10,
    paddingLeft: 10,
    backgroundColor: "#FFFFFF",
  },
  closeButton: {
    padding: 4,
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 24,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: "#B4DBFF",
    borderRadius: 24,
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  nickname: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  editProfile: {
    fontSize: 14,
    color: "#8E8E93",
  },
  menuSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  menuList: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 22,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  bottomSection: {
    marginTop: "auto",
    backgroundColor: "#FFFFFF",
  },
  logoutButton: {
    padding: 22,
    paddingHorizontal: 25,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FF0000",
  },
});
