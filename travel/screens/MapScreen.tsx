import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import EarIcon from "../assets/ear.svg";
import TMap from "../components/TMap";

const MapScreen = () => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.navigate("Main");
  };

  const handleEarPress = () => {
    navigation.navigate("Tour");
  };

  return (
    <View style={styles.container}>
      <TMap />
      <View style={styles.dimLayer} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>지도</Text>
        <TouchableOpacity style={styles.earButton} onPress={handleEarPress}>
          <EarIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dimLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 48,
    zIndex: 2,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  earButton: {
    padding: 8,
  },
});

export default MapScreen;
