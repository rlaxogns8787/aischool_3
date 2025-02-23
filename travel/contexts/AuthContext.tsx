import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type User = {
  id: string;
  email: string;
  username?: string;
  nickname?: string;
  birthYear?: string;
  gender?: "male" | "female";
  marketing?: boolean;
  preferences?: string[]; // 사용자 관심사
  music_genres?: string[]; // 음악 장르 선호도
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<User>
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 스토리지 키
const USER_STORAGE_KEY = "@user";
const AUTH_STORAGE_KEY = "@auth_credentials";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 저장된 사용자 정보 불러오기
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log("🔍 [AuthContext] 저장된 사용자 정보 불러오기 시작");
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const parsedUser = JSON.parse(userJson);
        console.log("📋 [AuthContext] 불러온 사용자 정보:", {
          id: parsedUser.id,
          preferences: parsedUser.preferences || [],
          music_genres: parsedUser.music_genres || [],
        });
        setUser(parsedUser);
      } else {
        console.log("❌ [AuthContext] 저장된 사용자 정보 없음");
      }
    } catch (error) {
      console.error("❌ [AuthContext] 사용자 정보 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // 실제로는 여기서 서버 인증을 구현해야 합니다
      // 지금은 임시로 이메일을 ID로 사용
      const mockUser: User = {
        id: email,
        email,
        nickname: "",
        birthYear: "",
        gender: "male",
        marketing: false,
      };

      // 사용자 정보 저장
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ email, password })
      );

      setUser(mockUser);
    } catch (error) {
      console.error("Failed to sign in:", error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<User>
  ) => {
    try {
      // 실제로는 여기서 서버에 회원가입 요청을 해야 합니다
      const newUser: User = {
        id: email,
        email,
        ...userData, // userData를 먼저 spread하여 기본값 대신 전달된 값을 사용
      };

      // 사용자 정보 저장
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ email, password })
      );

      setUser(newUser);
    } catch (error) {
      console.error("Failed to sign up:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // 저장된 정보 삭제
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);

      setUser(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) {
        console.log(
          "❌ [AuthContext] 프로필 업데이트 실패: 로그인된 사용자 없음"
        );
        return;
      }

      // 관심사 업데이트 로깅
      if (data.preferences) {
        console.log("🔄 [AuthContext] 관심사 업데이트", {
          current: user.preferences || [],
          new: data.preferences,
          changed:
            JSON.stringify(user.preferences) !==
            JSON.stringify(data.preferences),
        });
      }

      const updatedUser = { ...user, ...data };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

      // userData도 함께 업데이트
      const userDataStr = await AsyncStorage.getItem("userData");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const updatedUserData = { ...userData, ...data };
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
        console.log("✅ [AuthContext] userData 동기화 완료", {
          preferences: updatedUserData.preferences,
          music_genres: updatedUserData.music_genres,
        });
      }

      console.log("✅ [AuthContext] 프로필 업데이트 완료", {
        preferences: updatedUser.preferences,
        music_genres: updatedUser.music_genres,
      });

      setUser(updatedUser);
    } catch (error) {
      console.error("❌ [AuthContext] 프로필 업데이트 실패:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
