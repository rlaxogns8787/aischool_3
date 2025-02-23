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
  KeyboardAvoidingView,
  Platform,
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
import {
  registerUser,
  loginUser,
  checkNicknameDuplicate,
} from "../api/loginapi";
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
  "기발한",
  "느긋한",
  "다정한",
  "유쾌한",
  "창의적인",
  "의젓한",
  "고요한",
  "정직한",
  "상쾌한",
  "밝은",
  "온화한",
  "대담한",
  "강인한",
  "순수한",
  "용의주도한",
  "차분한",
  "활기찬",
  "신비로운",
  "매력적인",
  "독창적인",
  "반짝이는",
  "섬세한",
  "끈기왕",
  "즐거운",
  "낙천적인",
  "순진한",
  "명랑한",
  "포근한",
  "부드러운",
  "호기심 잔뜩",
  "따사로운",
  "평화로운",
  "다재다능한",
  "유능한",
  "멍때리는",
  "예리한",
  "변덕스러운",
  "감성적인",
  "차가운",
  "힙한",
  "이해심 잔뜩",
  "정열적인",
  "지적인",
  "신중한",
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
  "수달",
  "너구리",
  "늑대",
  "올빼미",
  "부엉이",
  "다람쥐",
  "고슴도치",
  "두루미",
  "원숭이",
  "미어캣",
  "카피바라",
  "악어",
  "거북이",
  "뱀",
  "공룡",
  "치타",
  "재규어",
  "캥거루",
  "알파카",
  "라마",
  "청설모",
  "수리부엉이",
  "살쾡이",
  "하이에나",
  "말",
  "고래",
  "문어",
  "해달",
  "오리너구리",
  "딱따구리",
  "독수리",
  "참새",
  "까마귀",
  "비둘기",
  "타조",
  "스컹크",
  "무당벌레",
  "나비",
  "개구리",
  "두더지",
  "사슴",
  "노루",
  "여우원숭이",
  "코뿔소",
  "하마",
  "불가사리",
  "가재",
  "고래상어",
  "호저",
  "족제비",
  "밍크",
  "담비",
  "수리",
  "매",
  "돌핀",
  "플라밍고",
];

type AuthStep = "info" | "preference";

// 음악 장르 옵션 추가
const musicGenreOptions = [
  "팝송",
  "OLD POP",
  "K-POP",
  "Billboard Top 100",
  "클래식",
  "록",
  "힙합",
  "R&B",
  "어쿠스틱",
  "EDM",
  "포크",
  "재즈",
  "트로트",
  "가곡",
];

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
  const [selectedGender, setSelectedGender] = useState("male");
  const [showBirthYearPicker, setShowBirthYearPicker] = useState(false);
  const [selectedBirthYear, setSelectedBirthYear] = useState(String(maxYear));
  const [step, setStep] = useState<AuthStep>("info");
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedMusicGenres, setSelectedMusicGenres] = useState<string[]>([]);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

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
    "문화",
    "예술",
    "디자인",
    "건축",
    "음악",
    "공연",
    "K-POP",
    "엔터테인먼트",
    "문학",
    "과학",
    "수학",
    "기술",
    "경제",
    "스포츠",
    "자동차",
    "요리",
    "음식",
    "패션",
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

  // 닉네임 변경 핸들러 수정
  const handleNicknameChange = (text: string) => {
    setNickname(text);
    // 중복 확인 관련 상태 업데이트 주석 처리
    /*
    setIsNicknameChecked(false);
    setIsNicknameValid(false);
    */
  };

  // 랜덤 닉네임 생성 핸들러 수정
  const handleRefreshNickname = () => {
    const newNickname = generateRandomNickname();
    setNickname(newNickname);
    // 중복 확인 관련 상태 업데이트 주석 처리
    /*
    setIsNicknameChecked(false);
    setIsNicknameValid(false);
    */
  };

  // 다음 단계로 이동하는 핸들러 수정
  const handleNextStep = () => {
    if (step === "info") {
      // 중복 확인 검증 주석 처리
      /*
      if (!isNicknameChecked || !isNicknameValid) {
        Alert.alert("알림", "닉네임 중복 확인이 필요합니다.");
        return;
      }
      */

      // 기존 유효성 검사
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

      setStep("preference");
    } else {
      // 회원가입 완료 처리
      handleSignUp();
    }
  };

  const handleSignUp = async () => {
    try {
      console.log("회원가입 요청 시작");

      // 1. 기본 정보 유효성 검사
      if (!email || !password || !nickname || !birthYear || !gender) {
        console.log("회원가입 실패: 필수 정보 미입력");
        Alert.alert("오류", "모든 필수 정보를 입력해주세요.");
        return;
      }

      if (password !== confirmPassword) {
        console.log("회원가입 실패: 비밀번호 불일치");
        Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
        return;
      }

      // 이메일 형식 검사
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log("회원가입 실패: 잘못된 이메일 형식");
        Alert.alert("오류", "올바른 이메일 형식이 아닙니다.");
        return;
      }

      // API 요청 데이터 구조를 백엔드 스펙에 맞게 수정
      const signUpData = {
        username: email,
        password: password,
        nickname: nickname,
        birthyear: parseInt(birthYear),
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        marketing_consent: route.params?.agreements?.marketing ? 1 : 0,
      };

      console.log("회원가입 API 요청 데이터:", signUpData);

      // 2. 회원가입 API 호출
      const response = await registerUser(signUpData);
      console.log("회원가입 응답:", response);

      if (response.message === "User created successfully") {
        console.log("회원가입 성공: 로그인 시도");

        // 3. 회원가입 성공 시 자동 로그인
        const loginData = {
          username: email,
          password: password,
        };

        const loginResponse = await loginUser(loginData);
        console.log("로그인 응답:", loginResponse);

        if (loginResponse.message === "Logged in successfully") {
          // 4. 로그인 성공 시 사용자 정보 저장
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(loginResponse.user_info)
          );

          // 5. Context API를 통한 로컬 상태 업데이트
          await signUp(email, password, {
            nickname: loginResponse.user_info.nickname,
            birthYear: loginResponse.user_info.birthyear.toString(),
            gender: loginResponse.user_info.gender.toLowerCase() as
              | "male"
              | "female",
            marketing: loginResponse.user_info.marketing_consent,
            preferences: selectedPreferences,
          });

          // 6. 온보딩 화면으로 이동
          navigation.replace("Onboarding");
        }
      }
    } catch (error: any) {
      console.error("회원가입 에러:", error);
      Alert.alert("오류", error.message || "회원가입에 실패했습니다.");
    }
  };

  const handleLogin = async () => {
    try {
      if (isLoading) return; // 이미 로딩 중이면 중복 요청 방지

      console.log("로그인 요청 시작");

      if (!email || !password) {
        console.log("로그인 실패: 이메일 또는 비밀번호 미입력");
        Alert.alert("오류", "이메일과 비밀번호를 입력해주세요.");
        return;
      }

      setIsLoading(true);
      setLoginAttempts((prev) => prev + 1);

      const loginData = {
        username: email,
        password: password,
      };
      console.log("로그인 요청 데이터:", loginData);

      const response = await loginUser(loginData);
      console.log("로그인 응답:", response);

      if (response.message === "Logged in successfully") {
        console.log("로그인 성공: 사용자 정보 저장");

        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.user_info)
        );

        await signIn(email, password);
        navigation.replace("Main");
      }
    } catch (error: any) {
      console.error("로그인 에러:", error);

      // 네트워크 에러인 경우 사용자에게 알림
      if (error.message === "Network Error") {
        Alert.alert("네트워크 오류", "인터넷 연결을 확인해주세요.", [
          {
            text: "확인",
            onPress: () => console.log("네트워크 에러 알림 확인"),
          },
        ]);
      } else {
        Alert.alert("오류", error.message || "로그인에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
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
      // API 요청 데이터 구조화
      const signUpData = {
        username: email,
        password: password,
        nickname: nickname,
        birthyear: parseInt(birthYear),
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        marketing_consent: route.params?.agreements?.marketing ? 1 : 0,
        // 빈 배열로 전송
        preferences: [],
        music_genres: [],
      };

      const response = await registerUser(signUpData);

      if (response.message === "User created successfully") {
        // 자동 로그인 처리
        const loginData = {
          username: email,
          password: password,
        };

        const loginResponse = await loginUser(loginData);

        if (loginResponse.message === "Logged in successfully") {
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(loginResponse.user_info)
          );

          await signUp(email, password, {
            nickname: loginResponse.user_info.nickname,
            birthYear: loginResponse.user_info.birthyear.toString(),
            gender: loginResponse.user_info.gender.toLowerCase() as
              | "male"
              | "female",
            marketing: loginResponse.user_info.marketing_consent,
            preferences: [],
            music_genres: [],
          });

          navigation.replace("Onboarding");
        }
      }
    } catch (error: any) {
      console.error("회원가입 요청 실패:", error);
      Alert.alert("오류", error.message || "회원가입에 실패했습니다.");
    }
  };

  const handleCompleteWithPreferences = async () => {
    try {
      // API 요청 데이터 구조화
      const signUpData = {
        username: email,
        password: password,
        nickname: nickname,
        birthyear: parseInt(birthYear),
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        marketing_consent: route.params?.agreements?.marketing ? 1 : 0,
        preferences: selectedPreferences,
        music_genres: selectedMusicGenres,
      };

      const response = await registerUser(signUpData);

      if (response.message === "User created successfully") {
        // 자동 로그인 처리
        const loginData = {
          username: email,
          password: password,
        };

        const loginResponse = await loginUser(loginData);

        if (loginResponse.message === "Logged in successfully") {
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(loginResponse.user_info)
          );

          await signUp(email, password, {
            nickname: loginResponse.user_info.nickname,
            birthYear: loginResponse.user_info.birthyear.toString(),
            gender: loginResponse.user_info.gender.toLowerCase() as
              | "male"
              | "female",
            marketing: loginResponse.user_info.marketing_consent,
            preferences: selectedPreferences,
            music_genres: selectedMusicGenres,
          });

          navigation.replace("Onboarding");
        }
      }
    } catch (error: any) {
      console.error("회원가입 요청 실패:", error);
      Alert.alert("오류", error.message || "회원가입에 실패했습니다.");
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

  // Picker 모달이 열릴 때 현재 값을 설정
  const handleOpenBirthYearPicker = () => {
    setSelectedBirthYear(birthYear || String(maxYear));
    setShowBirthYearPicker(true);
  };

  const handleOpenGenderPicker = () => {
    setSelectedGender(gender || "male");
    setShowGenderPicker(true);
  };

  // 완료 버튼 핸들러 수정
  const handleBirthYearComplete = () => {
    handleBirthYearSelect(selectedBirthYear || String(maxYear));
  };

  const handleGenderComplete = () => {
    handleGenderSelect(selectedGender || "male");
  };

  if (!isSignUp) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
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
                    editable={true}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>비밀번호</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="비밀번호를 입력해주세요"
                    secureTextEntry={!showPassword}
                    editable={true}
                    returnKeyType="done"
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
                      <View style={styles.nicknameContainer}>
                        <View style={styles.nicknameInputWrapper}>
                          <TextInput
                            style={styles.nicknameInput}
                            value={nickname}
                            onChangeText={handleNicknameChange}
                            placeholder="닉네임을 입력해주세요"
                            editable={true}
                          />
                          <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefreshNickname}
                          >
                            <RefreshIcon
                              width={24}
                              height={24}
                              stroke="#8E8E93"
                            />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          style={[styles.checkButton]}
                          disabled={true} // 버튼 비활성화
                          onPress={() => {}} // 빈 핸들러
                        >
                          <Text style={styles.checkButtonText}>중복 확인</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>출생연도</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={handleOpenBirthYearPicker}
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
                        onPress={handleOpenGenderPicker}
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
                    onPress={handleOpenBirthYearPicker}
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
                    onPress={handleOpenGenderPicker}
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
              style={[styles.signUpButton, isLoading && styles.disabledButton]}
              onPress={isSignUp ? handleSignUp : handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading
                  ? "로그인중..."
                  : isSocialSignUp
                  ? "시작하기"
                  : isSignUp
                  ? "회원가입"
                  : "로그인"}
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
        </KeyboardAvoidingView>
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
                editable={true}
                returnKeyType="next"
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
                  editable={true}
                  returnKeyType="done"
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
                  editable={true}
                  returnKeyType="done"
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
              <View style={styles.nicknameContainer}>
                <View style={styles.nicknameInputWrapper}>
                  <TextInput
                    style={styles.nicknameInput}
                    value={nickname}
                    onChangeText={handleNicknameChange}
                    placeholder="닉네임을 입력해주세요"
                    editable={true}
                  />
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefreshNickname}
                  >
                    <RefreshIcon width={24} height={24} stroke="#8E8E93" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.checkButton]}
                  disabled={true} // 버튼 비활성화
                  onPress={() => {}} // 빈 핸들러
                >
                  <Text style={styles.checkButtonText}>중복 확인</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>출생연도 *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handleOpenBirthYearPicker}
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
                onPress={handleOpenGenderPicker}
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

            {/* 출생연도 Picker 모달 */}
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
                    onPress={handleBirthYearComplete}
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
                  selectedValue={selectedBirthYear}
                  onValueChange={setSelectedBirthYear}
                  style={styles.picker}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={`${year}년`} value={year} />
                  ))}
                </Picker>
              </View>
            </Modal>

            {/* 성별 Picker 모달 */}
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
                    onPress={handleGenderComplete}
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
                  selectedValue={selectedGender}
                  onValueChange={setSelectedGender}
                  style={styles.picker}
                >
                  <Picker.Item label="남자" value="male" />
                  <Picker.Item label="여자" value="female" />
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
              관심사를 기반으로 도슨트 가이드 진행
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

            <Text style={[styles.title, { marginTop: 32 }]}>
              선호하는 음악 장르를 모두 선택해주세요
            </Text>
            <Text style={styles.subtitle}>장르 기반으로 노래 추천 진행</Text>
            <View style={styles.preferencesContainer}>
              {musicGenreOptions.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.preferenceButton,
                    selectedMusicGenres.includes(genre) &&
                      styles.preferenceButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedMusicGenres((prev) =>
                      prev.includes(genre)
                        ? prev.filter((g) => g !== genre)
                        : [...prev, genre]
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.preferenceButtonText,
                      selectedMusicGenres.includes(genre) &&
                        styles.preferenceButtonTextSelected,
                    ]}
                  >
                    {genre}
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
    marginBottom: 8,
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
  nicknameContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  nicknameInputWrapper: {
    flex: 1,
    position: "relative",
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  refreshButton: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  checkButton: {
    backgroundColor: "#C5C6CC", // 비활성화된 버튼 색상
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
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
  disabledButton: {
    backgroundColor: "#E6E8E8",
  },
});
