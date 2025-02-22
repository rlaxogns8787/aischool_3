import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview"; // ✅ WebView 추가

declare global {
  interface Window {
    Tmapv2: any;
  }
}

interface LocationData {
  latitude: number;
  longitude: number;
}

const TMapRoute: React.FC = () => {
  const webviewRef = useRef<WebView | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);

  useEffect(() => {
    // 🔹 예제 데이터 (실제 API에서 불러올 데이터)
    const fetchedLocations: LocationData[] = [
      { latitude: 37.5652045, longitude: 126.98602028 },
      { latitude: 37.5655045, longitude: 126.98752028 },
      { latitude: 37.5658045, longitude: 126.98852028 },
    ];

    setLocations(fetchedLocations);

    // ✅ WebView가 로드된 후 마커 추가 (injectJavaScript 사용)
    setTimeout(() => {
      if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`
          updateMarkers(${JSON.stringify(fetchedLocations)});
          true;
        `);
      }
    }, 2000); // WebView 로드 후 실행 (2초 후 실행)
  }, []);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://apis.openapi.sk.com/tmap/vectorjs?version=1&appKey=YOUR_TMAP_API_KEY"></script>
      <style>
        html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map;
        var markers = [];

        function initTmap() {
          map = new window.Tmapv2.Map("map", {
            center: new window.Tmapv2.LatLng(37.5652045, 126.98702028),
            width: "100%",
            height: "400px",
            zoom: 15
          });

          function updateMarkers(locations) {
            // 기존 마커 삭제
            markers.forEach(marker => marker.setMap(null));
            markers = [];

            locations.forEach((loc) => {
              var marker = new window.Tmapv2.Marker({
                position: new window.Tmapv2.LatLng(loc.latitude, loc.longitude),
                map: map,
              });
              markers.push(marker);
            });

            // 지도 중심을 첫 번째 마커로 이동
            if (locations.length > 0) {
              map.setCenter(new window.Tmapv2.LatLng(locations[0].latitude, locations[0].longitude));
            }
          }
        window.onload = initTmap;
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html: htmlContent }}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onError={(syntheticEvent) => {
          console.warn("WebView error:", syntheticEvent.nativeEvent);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default TMapRoute;
