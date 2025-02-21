import React, { useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const GuideImage = require('../assets/aitravelguide.jpg');
const ScheduleImage = require('../assets/aischedule.webp');

const { width } = Dimensions.get('window')

type OnboardingScreenProps = {
  navigation: any
}

const slides = [
  {
    id: 1,
    image: GuideImage,
    title: '나만을 위한 도슨트 설명!',
    subtitle: 'SSAPY는 당신만을 위한 개인 맞춤 여행 가이드입니다!\n 여행 일정 동안 당신의 취향에 맞춘 설명을 제공하며, \n마치 개인 가이드처럼 주요 관광지를 안내해 드립니다.'
  },
  {
    id: 2,
    image: ScheduleImage,
    title: '일정이 짜기 귀찮다면?',
    subtitle: 'AI가 당신의 스타일을 반영해 최적의 일정을 추천합니다.\n 기본 정보만 선택하면 나머지는 알아서 척척! \n 편하게 여행을 즐길 수 있습니다.'
  }
]

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  const updateCurrentSlideIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x
    const currentIndex = Math.round(contentOffsetX / width)
    setCurrentSlideIndex(currentIndex)
  }

  const goToAuthScreen = () => {
    navigation.navigate('Auth')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={updateCurrentSlideIndex}
        scrollEventThrottle={16}
        style={styles.sliderContainer}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <Image
              source={slide.image}
              style={styles.image}
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentSlideIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={goToAuthScreen}>
        <Text style={styles.buttonText}>다음</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sliderContainer: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    resizeMode: 'contain',
    borderRadius: 20,
    marginBottom: 30,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#007AFF',
    width: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
}) 