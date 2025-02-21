import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const TMAP_API_KEY = "8ezbqMgfXa1X46n2tLOy7NtZv2HdDj03blR523oh";

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
  };
}

const TMap: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

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
          var map = new Tmapv2.Map("map", {
            center: new Tmapv2.LatLng(${
              location?.coords.latitude || 37.566481
            }, ${location?.coords.longitude || 126.985032}),
            width: "100%",
            height: "100%",
            zoom: 15
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        source={{ html: htmlContent }}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
});

export default TMap;
