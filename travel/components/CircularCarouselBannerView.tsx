import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width;
const BANNER_HEIGHT = 88;
const AUTO_SCROLL_INTERVAL = 3000;

interface CircularCarouselBannerViewProps {
  onBannerPress?: (index: number) => void;
}

export default function CircularCarouselBannerView({ onBannerPress }: CircularCarouselBannerViewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const banners = [
    require('../assets/banner1.png'),
    require('../assets/banner2.png'),
    require('../assets/banner3.png'),
    require('../assets/banner4.png'),
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      const nextPage = (currentPage + 1) % banners.length;
      scrollViewRef.current?.scrollTo({
        x: nextPage * BANNER_WIDTH,
        animated: true,
      });
      setCurrentPage(nextPage);
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(timer);
  }, [currentPage]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / BANNER_WIDTH);
    setCurrentPage(page);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            onPress={() => onBannerPress?.(index)}
          >
            <Image
              source={banner}
              style={styles.banner}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentPage && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    width: width,
  },
  scrollView: {
    width: width,
  },
  banner: {
    width: width,
    height: BANNER_HEIGHT,
  },
  pagination: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#006FFD',
    width: 16,
  },
}); 