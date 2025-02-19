import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TMapView, { Marker } from "react-native-tmap"; // TMap SDK 사용
import { WebView } from "react-native-webview";
import { Text } from "react-native";

/** 장소 데이터 타입 */
interface Place {
  order: number;
  time: string;
  title: string;
  description: string;
  duration: string;
  address: string;
  cost: number;
  coords: {
    lat: number;
    lng: number;
  };
}

/** TripInfo 타입 정의 */
interface TripInfo {
  tripId: string;
  title: string;
  startDate: string;
  endDate: string;
  days: {
    dayIndex: number;
    date: string;
    places: {
      order: number;
      time: string;
      title: string;
      description: string;
      duration: string;
      address: string;
      cost: number;
      coords: {
        lat: number;
        lng: number;
      };
    }[];
  }[];
}

/** TMapScreen 컴포넌트 */
const TMapScreen: React.FC = () => {
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);

  /** AsyncStorage에서 tripInfo 데이터 가져오기 */
  useEffect(() => {
    console.log("🚀 `useEffect` 실행됨! TMapScreen.tsx");

    const fetchData = async () => {
      try {
        const jsonData = await AsyncStorage.getItem("scheduleData");

        // 🔍 Step 1: scheduleData 존재 여부 확인
        if (!jsonData) {
          console.warn("⚠️ `scheduleData`가 AsyncStorage에 없음!");
          return;
        }

        console.log("🔵 TMapScreen에서 불러온 scheduleData:", jsonData);

        if (jsonData) {
          const parsedData = JSON.parse(jsonData); // JSON 파싱
          console.log("📍 파싱된 tripInfo:", parsedData); // ✅ 데이터 확인

          setTripInfo(parsedData); // ✅ 상태 업데이트 추가
        } else {
          console.warn("⚠️ 저장된 여행 일정이 없습니다.");
        }
      } catch (error) {
        console.error("❌ 여행 일정 불러오기 실패:", error);
      }
    };
    fetchData();
  }, []);

  /** 데이터가 없으면 로딩 화면 표시 */
  if (!tripInfo) {
    return <Text>⏳ 여행 데이터를 불러오는 중...</Text>;
  }

  /** WebView에서 실행할 JavaScript 코드 */
  const injectedJavaScript = `
    var map = new Tmapv2.Map("map_div", {
        center: new Tmapv2.LatLng(37.5665, 126.9780),
        width: "100%",
        height: "100%",
        zoom: 12
    });

    var tripInfo = ${JSON.stringify(tripInfo)};
    
    tripInfo.days.forEach(day => {
      if (!day.places) return;  // ✅ places가 없을 경우 대비
        day.places.forEach((place, index) => {
            if (!place.coords || place.coords.lat === 0 || place.coords.lng === 0) return; // ✅ 좌표가 0,0이면 스킵

            var marker = new Tmapv2.Marker({
                position: new Tmapv2.LatLng(place.coords.lat, place.coords.lng),
                map: map
            });

            var infoWindow = new Tmapv2.InfoWindow({
                position: new Tmapv2.LatLng(place.coords.lat, place.coords.lng),
                content: "<div style='background:white;padding:5px;border-radius:5px;'>" + place.title + "</div>"
            });

            marker.addListener("click", function() {
                infoWindow.setMap(map);
            });

            if (index > 0) {
                var prevPlace = day.places[index - 1];
                var route = new Tmapv2.Polyline({
                    path: [
                        new Tmapv2.LatLng(prevPlace.coords.lat, prevPlace.coords.lng),
                        new Tmapv2.LatLng(place.coords.lat, place.coords.lng)
                    ],
                    strokeColor: "#FF0000",
                    strokeWeight: 5,
                    map: map
                });
            }
        });
    });
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={["*"]}
        source={{
          html: `
          <!DOCTYPE html>
          <html>
          <head>
            <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=8ezbqMgfXa1X46n2tLOy7NtZv2HdDj03blR523oh"></script>
          </head>
          <body>
            <div id="map_div" style="width:100%; height:100vh;"></div>
            <script>${injectedJavaScript}</script>
          </body>
          </html>
        `,
        }}
        javaScriptEnabled={true}
      />
    </View>
  );
};

export default TMapScreen;
