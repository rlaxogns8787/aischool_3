import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MenuIcon from '../assets/menu.svg'
import SearchIcon from '../assets/search.svg'
import CircularCarouselBannerView from '../components/CircularCarouselBannerView'

type ScheduleScreenProps = {
  navigation: any
}

export default function ScheduleScreen({ navigation }: ScheduleScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <MenuIcon width={24} height={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchButton}>
          <SearchIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.adContainer}>
        <CircularCarouselBannerView onBannerPress={(index) => {
          console.log('Banner pressed:', index);
        }} />
      </View>

      <View style={styles.content}>
        <Image 
          source={require('../assets/empty.png')} 
          style={styles.emptyImage}
        />
        <Text style={styles.emptyTitle}>아직 여행 예정되어 있지 않네요</Text>
        <Text style={styles.emptySubtitle}>새로운 여행을 계획해보세요</Text>
      </View>

      <TouchableOpacity 
        style={styles.registerButton}
        onPress={() => {/* 일정 등록 페이지로 이동 */}}
      >
        <Text style={styles.buttonText}>일정 등록</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  searchButton: {
    padding: 4,
  },
  adContainer: {
    width: '100%',
    height: 88,
    backgroundColor: '#F8F9FF',
  },
  adContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  adText: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 14,
    color: '#000',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#007AFF',
  },
  inactiveDot: {
    backgroundColor: '#D1D1D6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
    backgroundColor: '#EAF2FF',
    borderRadius: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2024',
    marginBottom: 8,
    letterSpacing: 0.005 * 18,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#71727A',
    marginBottom: 32,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 40,
    marginBottom: 90,
    height: 47,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 15,
  },
})

