import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, RefreshCw } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { updateUserInfo } from "../api/loginapi";

type EditProfileScreenProps = {
  navigation: DrawerNavigationProp<any>;
  route: {
    params: {
      field: "nickname" | "birthyear" | "gender" | "password";
      currentValue?: string;
    };
  };
};

const ADJECTIVES = [
  "귀여운",
  "용감한",
  "행복한",
  "즐거운",
  "신나는",
  "따뜻한",
  "멋진",
  "영리한",
  "현명한",
  "활발한",
  "친절한",
  "상냥한",
  "씩씩한",
  "재미있는",
  "똑똑한",
];

const ANIMALS = [
  "강아지",
  "고양이",
  "토끼",
  "사자",
  "호랑이",
  "팬더",
  "코알라",
  "기린",
  "코끼리",
  "펭귄",
  "돌고래",
  "여우",
  "곰",
  "햄스터",
  "다람쥐",
];

const generateRandomNickname = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective} ${animal}`;
};

export default function EditProfileScreen({
  navigation,
  route,
}: EditProfileScreenProps) {
  const { field, currentValue } = route.params;
  const [value, setValue] = useState(currentValue || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const getFieldTitle = () => {
    switch (field) {
      case "nickname":
        return "닉네임";
      case "birthyear":
        return "생년월일";
      case "gender":
        return "성별";
      case "password":
        return "비밀번호 변경";
      default:
        return "";
    }
  };

  const handleSave = async () => {
    try {
      let response;
      switch (field) {
        case "password":
          if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert("오류", "모든 필드를 입력해주세요.");
            return;
          }
          if (newPassword !== confirmPassword) {
            Alert.alert("오류", "새 비밀번호가 일치하지 않습니다.");
            return;
          }
          response = await updateUserInfo(field, "", {
            oldPassword,
            newPassword,
          });
          break;

        case "birthyear":
          const yearValue = parseInt(value);
          if (isNaN(yearValue)) {
            Alert.alert("오류", "올바른 연도를 입력해주세요.");
            return;
          }
          response = await updateUserInfo(field, yearValue);
          break;

        default:
          response = await updateUserInfo(field, value);
      }

      if (response.success) {
        Alert.alert("성공", "정보가 수정되었습니다.", [
          {
            text: "확인",
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        throw new Error(response.message || "정보 업데이트에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.message.includes("인증")) {
        Alert.alert("인증 오류", "다시 로그인해주세요.", [
          {
            text: "확인",
            onPress: () => navigation.navigate("Auth"),
          },
        ]);
      } else {
        Alert.alert(
          "오류",
          error.message || "서버 통신 중 오류가 발생했습니다."
        );
      }
    }
  };

  const renderContent = () => {
    switch (field) {
      case "nickname":
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={value}
              onChangeText={setValue}
              placeholder="새 닉네임 입력"
            />
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => setValue(generateRandomNickname())}
            >
              <RefreshCw size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        );
      case "birthyear":
        return (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={value}
              onValueChange={(itemValue) => setValue(itemValue)}
              style={styles.picker}
            >
              {Array.from({ length: 100 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <Picker.Item
                    key={year.toString()}
                    label={year.toString()}
                    value={year.toString()}
                  />
                );
              })}
            </Picker>
          </View>
        );
      case "gender":
        return (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={value}
              onValueChange={(itemValue) => setValue(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="남자" value="Male" />
              <Picker.Item label="여자" value="Female" />
            </Picker>
          </View>
        );
      case "password":
        return (
          <View style={styles.passwordContainer}>
            <View style={styles.passwordInputWrapper}>
              <Text style={styles.passwordLabel}>현재 비밀번호</Text>
              <TextInput
                style={styles.passwordInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="현재 비밀번호를 입력하세요"
                secureTextEntry
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.passwordInputWrapper}>
              <Text style={styles.passwordLabel}>새 비밀번호</Text>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="새 비밀번호를 입력하세요"
                secureTextEntry
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.passwordInputWrapper}>
              <Text style={styles.passwordLabel}>새 비밀번호 확인</Text>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="새 비밀번호를 다시 입력하세요"
                secureTextEntry
                placeholderTextColor="#8E8E93"
              />
            </View>
          </View>
        );
      default:
        return null;
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
        <Text style={styles.title}>{getFieldTitle()}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>{renderContent()}</View>
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
  saveButton: {
    position: "absolute",
    right: 16,
    padding: 8,
  },
  saveButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginBottom: 16,
  },
  input: {
    paddingVertical: 8,
    fontSize: 16,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginBottom: 16,
  },
  picker: {
    height: 150,
  },
  passwordContainer: {
    gap: 16,
    paddingTop: 16,
  },
  passwordInputWrapper: {
    gap: 8,
  },
  passwordLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginLeft: 4,
  },
  passwordInput: {
    fontSize: 16,
    color: "#000000",
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
});
