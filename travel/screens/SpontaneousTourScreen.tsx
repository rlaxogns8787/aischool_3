import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import axios from "axios";
import { ArrowLeft, Navigation } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AZURE_SEARCH_ENDPOINT,
  AZURE_SEARCH_KEY,
  ATTRACTION_INDEX,
} from "../api/openai";

interface Attraction {
  AREA_CLTUR_TRRSRT_NM: string; // 관광지명
  SUMRY_CN: string; // 설명
  CTLSTT_LA_LO: {
    type: string;
    coordinates: number[];
  };
  distance?: number;
}

export default function SpontaneousTourScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    checkLocationAndFetchAttractions();
  }, []);

  const checkLocationAndFetchAttractions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 권한이 필요합니다");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);

      await fetchNearbyAttractions(location);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("오류", "위치 정보를 가져오는데 실패했습니다.");
      setIsLoading(false);
    }
  };

  const fetchNearbyAttractions = async (location: Location.LocationObject) => {
    try {
      const response = await axios.post(
        `${AZURE_SEARCH_ENDPOINT}/indexes/${ATTRACTION_INDEX}/docs/search?api-version=2021-04-30-Preview`,
        {
          search: "*",
          filter: `geo.distance(CTLSTT_LA_LO, geography'POINT(${location.coords.longitude} ${location.coords.latitude})') le 10000`,
          select: "AREA_CLTUR_TRRSRT_NM, SUMRY_CN, CTLSTT_LA_LO",
          top: 30,
          orderby: `geo.distance(CTLSTT_LA_LO, geography'POINT(${location.coords.longitude} ${location.coords.latitude})')`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_SEARCH_KEY,
          },
        }
      );

      const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      const allAttractions = response.data.value;
      const shuffledAttractions = shuffleArray([...allAttractions]);
      const selectedAttractions = shuffledAttractions.slice(0, 7);

      const nearbyAttractions = selectedAttractions
        .map((attraction: Attraction) => ({
          ...attraction,
          distance: calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            attraction.CTLSTT_LA_LO.coordinates[1],
            attraction.CTLSTT_LA_LO.coordinates[0]
          ),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setAttractions(nearbyAttractions);
      setIsLoading(false);
    } catch (error) {
      console.error("Nearby attractions search failed:", error);
      Alert.alert("오류", "주변 관광지 정보를 가져오는데 실패했습니다.");
      setIsLoading(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // 지구의 반경 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1000); // 미터 단위로 반환
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleRefresh = () => {
    setIsLoading(true);
    checkLocationAndFetchAttractions();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#4E7EB8", "#89BBEC", "#9AADC4"]}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>내 주변 둘러보기</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Navigation size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>주변 관광지를 찾고 있어요...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {attractions.length > 0 ? (
            attractions.map((attraction, index) => (
              <View key={index} style={styles.attractionCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.attractionName}>
                    {attraction.AREA_CLTUR_TRRSRT_NM}
                  </Text>
                  <Text style={styles.distance}>
                    {formatDistance(attraction.distance || 0)}
                  </Text>
                </View>
                <Text style={styles.description}>{attraction.SUMRY_CN}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                주변에서 추천할 만한 장소를 찾지 못했어요.{"\n"}
                다른 위치에서 다시 시도해보세요.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
  },
  attractionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  attractionName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  distance: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginLeft: 8,
  },
  description: {
    marginTop: 8,
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 24,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  noResultsText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
