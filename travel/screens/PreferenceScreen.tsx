import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type PreferenceScreenProps = {
  navigation: any
  route: {
    params: {
      email: string
      password: string
      userData: {
        nickname: string
        birthYear: string
        gender: 'male' | 'female'
        marketing: boolean
      }
    }
  }
}

const KEYWORDS = {
  interests: [
    '역사', '미술', '스포츠', '건축',
    '음악', '요리', '기술', '디자인',
    '과학', '언어', '패션', 'K-POP',
    '문학', '수학', '자동차'
  ],
  travelStyles: [
    '체험/액티비티', 'SNS핫플레이스',
    '자연', '유명지 우선',
    '여유롭게 힐링', '관광보다는 먹방',
    '쇼핑위주'
  ]
}

export default function PreferenceScreen({ navigation, route }: PreferenceScreenProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])

  const toggleSelection = (item: string, type: 'interests' | 'travelStyles') => {
    const currentSelection = type === 'interests' ? selectedInterests : selectedStyles
    const setSelection = type === 'interests' ? setSelectedInterests : setSelectedStyles

    if (currentSelection.includes(item)) {
      setSelection(currentSelection.filter(i => i !== item))
    } else {
      setSelection([...currentSelection, item])
    }
  }

  const handleComplete = async () => {
    try {
      if (selectedInterests.length === 0 || selectedStyles.length === 0) {
        Alert.alert('알림', '관심있는 주제와 여행스타일을 각각 1개 이상 선택해주세요.')
        return
      }

      // TODO: Save preferences to user data
      navigation.replace('Main')
    } catch (error) {
      Alert.alert('오류', '취향 정보 저장에 실패했습니다.')
      console.error(error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, { backgroundColor: '#E3EDFF' }]}>
              <Text style={[styles.stepNumber, { color: '#007AFF' }]}>✓</Text>
            </View>
            <Text style={[styles.stepText, { color: '#007AFF' }]}>약관 동의</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, { backgroundColor: '#E3EDFF' }]}>
              <Text style={[styles.stepNumber, { color: '#007AFF' }]}>✓</Text>
            </View>
            <Text style={[styles.stepText, { color: '#007AFF' }]}>사용자 정보</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, { backgroundColor: '#007AFF' }]}>
              <Text style={[styles.stepNumber, { color: '#fff' }]}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: '#007AFF' }]}>취향 분석</Text>
          </View>
        </View>

        <Text style={styles.description}>
          관심있는 주제를 기반으로 여행 가이드를 진행합니다.{'\n'}
          아래 선택 정보는 추후 마이페이지에서 설정 가능합니다.
        </Text>

        <Text style={styles.sectionTitle}>관심있는 주제 키워드를 모두 선택해주세요</Text>
        <View style={styles.keywordsContainer}>
          {KEYWORDS.interests.map((keyword) => (
            <TouchableOpacity
              key={keyword}
              style={[
                styles.keywordButton,
                selectedInterests.includes(keyword) && styles.keywordButtonActive
              ]}
              onPress={() => toggleSelection(keyword, 'interests')}
            >
              <Text style={[
                styles.keywordText,
                selectedInterests.includes(keyword) && styles.keywordTextActive
              ]}>
                {keyword}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>여행스타일을 모두 선택해주세요</Text>
        <View style={styles.keywordsContainer}>
          {KEYWORDS.travelStyles.map((style) => (
            <TouchableOpacity
              key={style}
              style={[
                styles.keywordButton,
                selectedStyles.includes(style) && styles.keywordButtonActive
              ]}
              onPress={() => toggleSelection(style, 'travelStyles')}
            >
              <Text style={[
                styles.keywordText,
                selectedStyles.includes(style) && styles.keywordTextActive
              ]}>
                {style}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            (selectedInterests.length === 0 || selectedStyles.length === 0) && styles.completeButtonDisabled
          ]}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>완료</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressLine: {
    height: 1,
    flex: 0.5,
    backgroundColor: '#E5E5EA',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  keywordButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  keywordButtonActive: {
    backgroundColor: '#007AFF',
  },
  keywordText: {
    color: '#007AFF',
    fontSize: 16,
  },
  keywordTextActive: {
    color: '#fff',
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}) 