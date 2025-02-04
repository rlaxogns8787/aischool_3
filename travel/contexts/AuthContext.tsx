import React, { createContext, useState, useContext, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type User = {
  id: string
  email: string
  nickname?: string
  birthYear?: string
  gender?: 'male' | 'female'
  marketing?: boolean
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 스토리지 키
const USER_STORAGE_KEY = '@user'
const AUTH_STORAGE_KEY = '@auth_credentials'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 저장된 사용자 정보 불러오기
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY)
      if (userJson) {
        setUser(JSON.parse(userJson))
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // 실제로는 여기서 서버 인증을 구현해야 합니다
      // 지금은 임시로 이메일을 ID로 사용
      const mockUser: User = {
        id: email,
        email,
        nickname: '',
        birthYear: '',
        gender: 'male',
        marketing: false,
      }
      
      // 사용자 정보 저장
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser))
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email, password }))
      
      setUser(mockUser)
    } catch (error) {
      console.error('Failed to sign in:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      // 실제로는 여기서 서버에 회원가입 요청을 해야 합니다
      const newUser: User = {
        id: email,
        email,
        ...userData,  // userData를 먼저 spread하여 기본값 대신 전달된 값을 사용
      }
      
      // 사용자 정보 저장
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email, password }))
      
      setUser(newUser)
    } catch (error) {
      console.error('Failed to sign up:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // 저장된 정보 삭제
      await AsyncStorage.removeItem(USER_STORAGE_KEY)
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
      
      setUser(null)
    } catch (error) {
      console.error('Failed to sign out:', error)
      throw error
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) return

      const updatedUser = { ...user, ...data }
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser))
      
      setUser(updatedUser)
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 