import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LogoIcon from "../assets/logo.svg";
import EyeIcon from "../assets/eye.svg";
import EyeOffIcon from "../assets/eye-off.svg";
import RefreshIcon from "../assets/refresh.svg";
import KakaoIcon from "../assets/kakao.svg";
import NaverIcon from "../assets/naver.svg";
import FacebookIcon from "../assets/facebook.svg";
import AppleIcon from "../assets/apple.svg";
import { useAuth } from "../contexts/AuthContext";
import { Picker } from "@react-native-picker/picker";
import { registerUser, loginUser } from "../api/loginapi";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthScreenProps = {
  navigation: any;
  route: {
    params?: {
      email?: string;
      provider?: "kakao" | "naver" | "facebook" | "apple";
      isSignUp?: boolean;
      agreements?: {
        marketing: boolean;
      };
    };
  };
};

// 닉네임 생성을 위한 데이터
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

type AuthStep = "info" | "preference";

export default function AuthScreen({ navigation, route }: AuthScreenProps) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(route.params?.isSignUp || false);
  const [email, setEmail] = useState(route.params?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState(generateRandomNickname());
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [selectedGender, setSelectedGender] = useState("");
  const [showBirthYearPicker, setShowBirthYearPicker] = useState(false);
  const [selectedBirthYear, setSelectedBirthYear] = useState("");
  const [step, setStep] = useState<AuthStep>("info");
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  // 사용자 정보 상태
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    gender: "",
  });

  // 취향 옵션
  const preferenceOptions = [
    "역사",
    "미술",
    "스포츠",
    "건축",
    "음악",
    "요리",
    "기술",
    "디자인",
    "과학",
    "언어",
    "패션",
    "K-POP",
    "문학",
    "수학",
    "자동차",
  ];

  const isSocialSignUp = route.params?.provider;

  // Generate years array (from current year to 100 years ago)
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 14; // 14세 이상만 가입 가능
  const years = Array.from({ length: 100 }, (_, i) => String(maxYear - i));

  useEffect(() => {
    if (route.params?.isSignUp) {
      setIsSignUp(true);
    }
  }, [route.params?.isSignUp]);

  // 랜덤 닉네임 생성 함수
  function generateRandomNickname() {
    const randomAdjective =
      ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return `${randomAdjective} ${randomAnimal}`;
  }

  // 닉네임 새로고침 핸들러
  const handleRefreshNickname = () => {
    setNickname(generateRandomNickname());
  };

  const handleNextStep = () => {
    if (step === "info") {
      // 기본 정보 유효성 검사
      if (
        !email ||
        !password ||
        !confirmPassword ||
        !nickname ||
        !birthYear ||
        !gender
      ) {
        Alert.alert("오류", "모든 필수 정보를 입력해주세요.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
        return;
      }

      // 다음 단계(취향 선택)로 이동
      setStep("preference");
    } else {
      // 회원가입 완료 처리
      handleSignUp();
    }
  };

  const handleSignUp = async () => {
    try {
      // 1. 기본 정보 유효성 검사
      if (!email || !password || !nickname || !birthYear || !gender) {
        Alert.alert("오류", "모든 필수 정보를 입력해주세요.");
        return;
      }

      // 서버로 전송할 데이터 로깅
      const signUpData = {
        username: email,
        password,
        nickname,
        birthyear: parseInt(birthYear),
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        marketing_consent: route.params?.agreements?.marketing ? 1 : 0,
      };
      console.log("회원가입 요청 데이터:", signUpData);

      // 2. 회원가입 API 호출
      const response = await registerUser(signUpData);
      console.log("회원가입 응답:", response);

      // 3. 회원가입 성공 시 사용자 정보 로컬 저장
      await AsyncStorage.setItem(
        "userData",
        JSON.stringify({
          username: email,
          nickname,
          birthyear: parseInt(birthYear),
          gender,
          marketing_consent: route.params?.agreements?.marketing ? 1 : 0,
          preferences: selectedPreferences,
        })
      );

      // 4. Context API를 통한 로컬 상태 업데이트
      await signUp(email, password, {
        nickname,
        birthYear,
        gender: gender as "male" | "female",
        marketing: route.params?.agreements?.marketing || false,
        preferences: selectedPreferences,
      });

      // 5. 회원가입 완료 후 온보딩 화면으로 이동
      navigation.replace("Onboarding");
    } catch (error) {
      console.error("상세 에러 정보:", error);
      if (error instanceof Error) {
        Alert.alert("오류", error.message || "회원가입에 실패했습니다.");
        console.error("회원가입 에러:", error);
      } else {
        Alert.alert("오류", "회원가입에 실패했습니다.");
        console.error("회원가입 에러:", error);
      }
    }
  };

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("오류", "이메일과 비밀번호를 입력해주세요.");
        return;
      }

      // API 호출
      const response = await loginUser({
        username: email,
        password,
      });

      if (response.message === "Logged in successfully") {
        // 사용자 정보 저장
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.user_info)
        );

        // 로그인 처리
        await signIn(email, password);

        // 메인 화면으로 이동
        navigation.replace("Main");
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("오류", error.message || "로그인에 실패했습니다.");
        console.error(error);
      } else {
        Alert.alert("오류", "로그인에 실패했습니다.");
        console.error(error);
      }
    }
  };

  const handleSocialAuth = async (provider: string) => {
    try {
      // TODO: Implement social auth
      navigation.navigate("Auth", {
        email: `${provider}@example.com`,
        provider,
      });
    } catch (error) {
      Alert.alert("오류", "소셜 로그인에 실패했습니다.");
      console.error(error);
    }
  };

  const handleToggleMode = () => {
    if (!isSignUp) {
      // 회원가입 모드로 전환할 때는 약관 동의 화면으로 이동
      navigation.navigate("Agreement");
    } else {
      setIsSignUp(false);
      // Reset form fields when switching back to login
      setPassword("");
      setConfirmPassword("");
      setNickname(generateRandomNickname());
      setBirthYear("");
      setGender("");
    }
  };

  const handleStepPress = (step: number) => {
    // 1단계(약관 동의)로 이동
    if (step === 1) {
      navigation.replace("Agreement", {
        email,
        isSignUp: true,
        direction: "back",
      });
    }
    // 2단계(사용자 정보)로 이동
    else if (step === 2) {
      setStep("info");
    }
  };

  const handleGenderSelect = (value: string) => {
    setSelectedGender(value);
    setGender(value);
    setShowGenderPicker(false);
  };

  const handleBirthYearSelect = (value: string) => {
    setSelectedBirthYear(value);
    setBirthYear(value);
    setShowBirthYearPicker(false);
  };

  const handlePreferenceToggle = (preference: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(preference)
        ? prev.filter((p) => p !== preference)
        : [...prev, preference]
    );
  };

  const handleSkipPreferences = async () => {
    try {
      // 취향 정보 없이 회원가입 진행
      await signUp(email, password, {
        nickname,
        birthYear,
        gender: gender as "male" | "female",
        marketing: route.params?.agreements?.marketing || false,
        preferences: [], // 빈 배열로 전달
      });

      navigation.replace("Onboarding");
    } catch (error) {
      Alert.alert("오류", "회원가입에 실패했습니다.");
      console.error(error);
    }
  };

  const handleCompleteWithPreferences = async () => {
    try {
      if (selectedPreferences.length === 0) {
        Alert.alert("알림", "하나 이상의 취향을 선택해주세요.");
        return;
      }

      // TODO: DB 연결 후 취향 정보 저장 로직 구현
      await signUp(email, password, {
        nickname,
        birthYear,
        gender: gender as "male" | "female",
        marketing: route.params?.agreements?.marketing || false,
        preferences: selectedPreferences,
      });

      navigation.replace("Onboarding");
    } catch (error) {
      Alert.alert("오류", "회원가입에 실패했습니다.");
      console.error(error);
    }
  };

  // 진행 상태 표시 UI
  const renderProgressSteps = () => (
    <View style={styles.progressContainer}>
      <TouchableOpacity
        style={styles.progressStep}
        onPress={() => handleStepPress(1)}
      >
        <View style={[styles.stepCircle, { backgroundColor: "#E3EDFF" }]}>
          <Text style={[styles.stepNumber, { color: "#007AFF" }]}>✓</Text>
        </View>
        <Text style={[styles.stepText, { color: "#007AFF" }]}>약관 동의</Text>
      </TouchableOpacity>
      <View style={styles.progressLine} />
      <TouchableOpacity
        style={styles.progressStep}
        onPress={() => handleStepPress(2)}
      >
        <View
          style={[
            styles.stepCircle,
            { backgroundColor: step === "info" ? "#007AFF" : "#E3EDFF" },
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              { color: step === "info" ? "#fff" : "#007AFF" },
            ]}
          >
            {step === "preference" ? "✓" : "2"}
          </Text>
        </View>
        <Text style={[styles.stepText, { color: "#007AFF" }]}>사용자 정보</Text>
      </TouchableOpacity>
      <View style={styles.progressLine} />
      <View style={styles.progressStep}>
        <View
          style={[
            styles.stepCircle,
            { backgroundColor: step === "preference" ? "#007AFF" : "#F5F5F5" },
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              { color: step === "preference" ? "#fff" : "#8E8E93" },
            ]}
          >
            3
          </Text>
        </View>
        <Text
          style={[
            styles.stepText,
            { color: step === "preference" ? "#007AFF" : "#8E8E93" },
          ]}
        >
          취향 분석
        </Text>
      </View>
    </View>
  );

  if (!isSignUp) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <LogoIcon width={200} height={200} style={styles.logo} />
            <Text style={styles.title}>
              {isSocialSignUp
                ? "추가 정보 입력"
                : isSignUp
                ? "회원가입"
                : "발길 닿는 곳마다,\n그곳의 이야기가 당신을 기다립니다"}
            </Text>
          </View>

          {!isSocialSignUp && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>이메일</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="이메일을 입력해주세요"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>비밀번호</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호를 입력해주세요"
                  secureTextEntry
                />
              </View>

              {isSignUp && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>비밀번호 확인</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="비밀번호를 다시 입력해주세요"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>닉네임</Text>
                    <View style={styles.nicknameInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="방황하는 너구리"
                        value={nickname}
                        onChangeText={setNickname}
                      />
                      <TouchableOpacity
                        style={styles.refreshIconButton}
                        onPress={handleRefreshNickname}
                      >
                        <RefreshIcon width={24} height={24} stroke="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>출생연도</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowBirthYearPicker(true)}
                    >
                      <Text
                        style={[
                          styles.pickerButtonText,
                          !birthYear && styles.placeholderText,
                        ]}
                      >
                        {birthYear || "선택해주세요"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>성별</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowGenderPicker(true)}
                    >
                      <Text
                        style={[
                          styles.pickerButtonText,
                          !gender && styles.placeholderText,
                        ]}
                      >
                        {gender
                          ? gender === "male"
                            ? "남자"
                            : "여자"
                          : "선택해주세요"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

          {isSocialSignUp && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>닉네임</Text>
                <TextInput
                  style={styles.input}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="닉네임을 입력해주세요"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>출생연도</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowBirthYearPicker(true)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      !birthYear && styles.placeholderText,
                    ]}
                  >
                    {birthYear || "선택해주세요"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>성별</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowGenderPicker(true)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      !gender && styles.placeholderText,
                    ]}
                  >
                    {gender
                      ? gender === "male"
                        ? "남자"
                        : "여자"
                      : "선택해주세요"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={isSignUp ? handleSignUp : handleLogin}
          >
            <Text style={styles.signUpButtonText}>
              {isSocialSignUp ? "시작하기" : isSignUp ? "회원가입" : "로그인"}
            </Text>
          </TouchableOpacity>

          {!isSocialSignUp && (
            <>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={handleToggleMode}
              >
                <Text style={styles.toggleButtonText}>
                  {isSignUp
                    ? "이미 계정이 있으신가요? 로그인"
                    : "계정이 없으신가요? 회원가입"}
                </Text>
              </TouchableOpacity>

              <View style={styles.socialContainer}>
                <Text style={styles.socialText}>간편 로그인</Text>
                <View style={styles.socialButtons}>
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      { backgroundColor: "#FEE500" },
                    ]}
                    onPress={() => handleSocialAuth("kakao")}
                  >
                    <KakaoIcon
                      width={24}
                      height={24}
                      style={styles.socialIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      { backgroundColor: "#03C75A" },
                    ]}
                    onPress={() => handleSocialAuth("naver")}
                  >
                    <NaverIcon
                      width={24}
                      height={24}
                      style={styles.socialIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      { backgroundColor: "#1877F2" },
                    ]}
                    onPress={() => handleSocialAuth("facebook")}
                  >
                    <FacebookIcon
                      width={24}
                      height={24}
                      style={styles.socialIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: "#000" }]}
                    onPress={() => handleSocialAuth("apple")}
                  >
                    <AppleIcon
                      width={24}
                      height={24}
                      style={styles.socialIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderProgressSteps()}

        {step === "info" ? (
          // 사용자 정보 입력 UI
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>이메일 주소 *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="이메일 주소를 입력해주세요"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호 *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호를 입력해주세요"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon width={24} height={24} stroke="#8E8E93" />
                  ) : (
                    <EyeIcon width={24} height={24} stroke="#8E8E93" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호 확인 *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="비밀번호를 다시 입력해주세요"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon width={24} height={24} stroke="#8E8E93" />
                  ) : (
                    <EyeIcon width={24} height={24} stroke="#8E8E93" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>닉네임 *</Text>
              <View style={styles.nicknameInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="방황하는 너구리"
                  value={nickname}
                  onChangeText={setNickname}
                />
                <TouchableOpacity
                  style={styles.refreshIconButton}
                  onPress={handleRefreshNickname}
                >
                  <RefreshIcon width={24} height={24} stroke="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>출생연도 *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowBirthYearPicker(true)}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    !birthYear && styles.placeholderText,
                  ]}
                >
                  {birthYear || "선택해주세요"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>성별 *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowGenderPicker(true)}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    !gender && styles.placeholderText,
                  ]}
                >
                  {gender
                    ? gender === "male"
                      ? "남자"
                      : "여자"
                    : "선택해주세요"}
                </Text>
              </TouchableOpacity>
            </View>

            <Modal
              visible={showGenderPicker}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.modalContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowGenderPicker(false)}
                    style={styles.pickerHeaderButton}
                  >
                    <Text style={styles.pickerHeaderButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedGender) handleGenderSelect(selectedGender);
                    }}
                    style={styles.pickerHeaderButton}
                  >
                    <Text
                      style={[
                        styles.pickerHeaderButtonText,
                        { color: "#007AFF" },
                      ]}
                    >
                      완료
                    </Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={selectedGender || gender}
                  onValueChange={setSelectedGender}
                  style={styles.picker}
                >
                  <Picker.Item label="남자" value="male" />
                  <Picker.Item label="여자" value="female" />
                </Picker>
              </View>
            </Modal>

            <Modal
              visible={showBirthYearPicker}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.modalContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowBirthYearPicker(false)}
                    style={styles.pickerHeaderButton}
                  >
                    <Text style={styles.pickerHeaderButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedBirthYear)
                        handleBirthYearSelect(selectedBirthYear);
                    }}
                    style={styles.pickerHeaderButton}
                  >
                    <Text
                      style={[
                        styles.pickerHeaderButtonText,
                        { color: "#007AFF" },
                      ]}
                    >
                      완료
                    </Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={selectedBirthYear || birthYear}
                  onValueChange={setSelectedBirthYear}
                  style={styles.picker}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={`${year}년`} value={year} />
                  ))}
                </Picker>
              </View>
            </Modal>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextStep}
            >
              <Text style={styles.nextButtonText}>다음</Text>
            </TouchableOpacity>
          </>
        ) : (
          // 취향 선택 UI
          <>
            <Text style={styles.title}>
              관심있는 주제 키워드를 모두 선택해주세요
            </Text>
            <Text style={styles.subtitle}>
              관심사를 기반으로 여행 가이드를 진행합니다.
            </Text>
            <View style={styles.preferencesContainer}>
              {preferenceOptions.map((preference) => (
                <TouchableOpacity
                  key={preference}
                  style={[
                    styles.preferenceButton,
                    selectedPreferences.includes(preference) &&
                      styles.preferenceButtonSelected,
                  ]}
                  onPress={() => handlePreferenceToggle(preference)}
                >
                  <Text
                    style={[
                      styles.preferenceButtonText,
                      selectedPreferences.includes(preference) &&
                        styles.preferenceButtonTextSelected,
                    ]}
                  >
                    {preference}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* 하단 버튼 영역 - 취향 선택 단계에서만 표시 */}
      {step === "preference" && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipPreferences}
          >
            <Text style={styles.skipButtonText}>넘어가기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteWithPreferences}
          >
            <Text style={styles.completeButtonText}>완료</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    lineHeight: 26,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: "#fff",
    width: "100%",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  genderButtonText: {
    fontSize: 16,
    color: "#000",
  },
  genderButtonTextActive: {
    color: "#fff",
  },
  signUpButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  toggleButton: {
    padding: 16,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  socialContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  socialText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
    padding: 4,
  },
  progressLine: {
    height: 1,
    flex: 0.5,
    backgroundColor: "#E5E5EA",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  nextButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#000",
  },
  placeholderText: {
    color: "#8E8E93",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerHeaderButton: {
    padding: 4,
  },
  pickerHeaderButtonText: {
    fontSize: 16,
    color: "#000",
  },
  picker: {
    backgroundColor: "#fff",
  },
  nicknameInputContainer: {
    position: "relative",
    width: "100%",
  },
  refreshIconButton: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    zIndex: 1,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  preferencesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  preferenceButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  preferenceButtonSelected: {
    backgroundColor: "#007AFF",
  },
  preferenceButtonText: {
    fontSize: 16,
    color: "#000",
  },
  preferenceButtonTextSelected: {
    color: "#fff",
  },
  bottomButtonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingTop: 12,
  },
  skipButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  completeButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#007AFF",
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
