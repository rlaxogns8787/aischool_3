// components/TMap_Route.tsx
import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Button } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { getSchedules } from "../api/loginapi"; // 일정 조회 함수 (예시)

const TMAP_API_KEY = "8ezbqMgfXa1X46n2tLOy7NtZv2HdDj03blR523oh";

// 일정 데이터 구조 (예시)
interface ScheduleData {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
}

// 라우트 타입 정의 (자동차, 도보, 대중교통 등)
type RouteType = "car" | "walk" | "transit";

interface TMapRouteProps {
  routeType?: RouteType;
  // 필요하다면 일정 배열을 직접 넘길 수도 있음: schedules?: ScheduleData[];
}

const TMap_Route: React.FC = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const webviewRef = useRef<WebView | null>(null);
  const [routeType, setRouteType] = useState<RouteType>("car");

  /**
   * 컴포넌트 초기화:
   * - 위치 권한 요청 + 현재 위치 가져오기
   * - 일정 데이터 가져오기
   * - WebView에 위치 정보 주입
   */
  useEffect(() => {
    (async () => {
      try {
        // 1) 위치 권한 확인 및 현재 위치 가져오기
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Permission to access location was denied");
          return;
        }
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const newLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setLocation(newLocation);

        // 2) 일정 데이터 가져오기 (AsyncStorage -> 서버 or local DB)
        const scheduleList = await getSchedules();
        // 서버 응답이 배열 형태라고 가정
        if (Array.isArray(scheduleList)) {
          setSchedules(scheduleList);
        }

        // 3) WebView가 이미 렌더링된 후에 현재 위치를 지도에 반영
        if (webviewRef.current) {
          webviewRef.current.injectJavaScript(`
            updateUserLocation(${newLocation.latitude}, ${newLocation.longitude});
            true;
          `);
        }
      } catch (error) {
        console.error("Error in TMap_Route useEffect:", error);
      }
    })();
  }, []);

  /**
   * 경로검색 API 엔드포인트 구분 (자동차, 도보, 대중교통)
   */
  const getRouteApiEndpoint = () => {
    if (routeType === "walk") {
      return `https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&appKey=${TMAP_API_KEY}`;
    } else if (routeType === "transit") {
      // 대중교통(버스/지하철) 버전은 3
      return `https://apis.openapi.sk.com/tmap/routes/transit?version=3&format=json&appKey=${TMAP_API_KEY}`;
    }
    // 기본 자동차
    return `https://apis.openapi.sk.com/tmap/routes?version=1&format=json&appKey=${TMAP_API_KEY}`;
  };

  // HTML/JS 문자열 구성
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${TMAP_API_KEY}"></script>
        <style>
          html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map;
          var userMarker;
          var currentLocationCircle;
          var lastKnownLocation;
          var routePolyline;

          // 지도 초기화
          function initMap() {
            var lat = ${location?.latitude || 37.566481};
            var lng = ${location?.longitude || 126.985032};

            map = new Tmapv2.Map("map", {
              center: new Tmapv2.LatLng(lat, lng),
              width: "100%",
              height: "100%",
              zoom: 14
            });

            // 사용자 위치 표시
            updateUserLocation(lat, lng);

            // 스케줄/마커/경로 데이터 주입
            var schedulesData = ${JSON.stringify(schedules)};
            var routeEndpoint = "${getRouteApiEndpoint()}";
            console.log("schedulesData:", schedulesData);
            console.log("routeEndpoint:", routeEndpoint);

            drawSchedulesAndRoute(schedulesData, routeEndpoint);
          }

          // 사용자 위치 갱신
          function updateUserLocation(lat, lng) {
            lastKnownLocation = { lat: lat, lng: lng };
            var userLocation = new Tmapv2.LatLng(lat, lng);

            if (userMarker) {
              userMarker.setMap(null);
            }
            if (currentLocationCircle) {
              currentLocationCircle.setMap(null);
            }

            currentLocationCircle = new Tmapv2.Circle({
              center: userLocation,
              radius: 12,
              fillColor: "#005EFF",
              fillOpacity: 0.8,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              map: map
            });

            userMarker = new Tmapv2.Marker({
              position: userLocation,
              icon: {
                url: "https://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png",
                size: new Tmapv2.Size(24, 38),
                anchor: new Tmapv2.Point(12, 38)
              },
              map: map,
              title: "현재 위치"
            });

            map.setCenter(userLocation);
          }

          // 스케줄 배열을 이용하여 마커와 경로 표시
          function drawSchedulesAndRoute(schedulesData, routeEndpoint) {
            if (!Array.isArray(schedulesData) || schedulesData.length === 0) {
              return;
            }

            // 1) 각 일정에 대한 마커 표시
            schedulesData.forEach(function(item, index) {
              var markerPos = new Tmapv2.LatLng(item.latitude, item.longitude);
              var marker = new Tmapv2.Marker({
                position: markerPos,
                icon: {
                  url: "https://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_" + (index+1) + ".png",
                  size: new Tmapv2.Size(24, 38),
                  anchor: new Tmapv2.Point(12, 38)
                },
                map: map,
                title: item.title ? item.title : ("일정_" + (index+1))
              });
            });

            // 2) 경로 검색 (최소 2개 이상 위치가 있어야)
            if (schedulesData.length >= 2) {
              var start = schedulesData[0];
              var end = schedulesData[schedulesData.length - 1];
              var viaPoints = schedulesData.slice(1, schedulesData.length - 1);

              var payload = {
                startX: start.longitude,
                startY: start.latitude,
                endX: end.longitude,
                endY: end.latitude,
                reqCoordType: "WGS84GEO",
                resCoordType: "WGS84GEO"
              };

              // 자동차 경로의 경우: searchOption, 구간옵션 등 추가 가능
              // 도보/대중교통 경로는 별도의 파라미터 구조를 가지므로 TMap 문서 참고
              // (예시) payload.searchOption = "0";

              // 중간 경유지
              if (viaPoints.length > 0) {
                payload.viaPoints = viaPoints.map(function(point) {
                  return point.longitude + "," + point.latitude;
                }).join(";");
              }

              // TMap 경로검색 API 호출
              fetch(routeEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              })
              .then(function(res){ return res.json(); })
              .then(function(data){
                console.log("경로 data:", data);

                // 자동차/도보/대중교통 API마다 구조가 조금씩 다를 수 있음
                // 아래는 자동차 경로 기준 예시
                if (data && data.features) {
                  var coordinates = [];

                  // features 배열 안에 LineString 형태가 여러 개 있을 수 있으므로
                  data.features.forEach(function(feature) {
                    if (feature.geometry && feature.geometry.type === "LineString") {
                      feature.geometry.coordinates.forEach(function(coord) {
                        // [경도, 위도] 형태이므로 순서를 바꿔야 함
                        coordinates.push(new Tmapv2.LatLng(coord[1], coord[0]));
                      });
                    }
                  });

                  // 기존 경로 제거
                  if (routePolyline) {
                    routePolyline.setMap(null);
                  }

                  // 새 폴리라인 생성
                  routePolyline = new Tmapv2.Polyline({
                    path: coordinates,
                    strokeColor: "#FF0000",
                    strokeWeight: 4,
                    map: map
                  });

                  // 전체 경로가 보이도록 fitBounds
                  var bounds = new Tmapv2.LatLngBounds();
                  coordinates.forEach(function(latlng) {
                    bounds.extend(latlng);
                  });
                  map.fitBounds(bounds);
                }
              })
              .catch(function(error){
                console.error("경로 요청 실패:", error);
              });
            }
          }

          // 초기화
          initMap();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: 10,
        }}
      >
        <Button title="자동차" onPress={() => setRouteType("car")} />
        <Button title="도보" onPress={() => setRouteType("walk")} />
        <Button title="대중교통" onPress={() => setRouteType("transit")} />
      </View>
      <View style={{ flex: 1 }}>
        <WebView
          ref={webviewRef}
          style={styles.webview}
          source={{ html: htmlContent }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error:", nativeEvent);
          }}
          onMessage={(event) => {
            console.log("WebView message:", event.nativeEvent.data);
          }}
        />
      </View>
    </View>
  );
};

export default TMap_Route;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
});
