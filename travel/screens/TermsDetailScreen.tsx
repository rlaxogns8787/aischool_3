import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Agreement: undefined;
  TermsDetail: {
    title?: string;
    content?: string;
  };
};

type TermsDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "TermsDetail"
>;

export default function TermsDetailScreen({
  navigation,
  route,
}: TermsDetailScreenProps) {
  const { title = "이용약관", content = "" } = route.params || {};

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: title,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, title]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.content}>{content}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: "#000",
  },
});
