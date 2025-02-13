import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import Modal from "react-native-modal";
import Carousel from "react-native-snap-carousel";
import Pagination from "react-native-snap-carousel/src/pagination/Pagination";

type OptionModalProps = {
  isVisible: boolean;
  onClose: () => void;
  images: { uri: string }[];
  themeName: string;
  rating: number; // 평점 삭제 예정
  description: string;
  keywords: string[];
  places: { image: { uri: string }; name: string; address: string }[];
  onShare: () => void;
  onPlacePress: (place: {
    image: { uri: string };
    name: string;
    address: string;
  }) => void;
  onShareWithColleagues: () => void;
};

const OptionModal: React.FC<OptionModalProps> = ({
  isVisible,
  onClose,
  images,
  themeName,
  rating,
  description,
  keywords,
  places,
  onShare,
  onPlacePress,
  onShareWithColleagues,
}) => {
  const [activeSlide, setActiveSlide] = React.useState(0);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      // swipeDirection="down"
      // onSwipeComplete={onClose} //손보거나 제외 라이브러리 문제일수도.. 스와이프해서 종료하기
      // onSwipeMove={onClose}

      // onTouchMove={onClose}
      onBackButtonPress={onClose}
      style={{
        margin: 0,
        justifyContent: "flex-end",
        marginHorizontal: 0,
        marginVertical: 0,
        marginTop: 150,
      }}
    >
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
        {/* <Carousel
          data={images}
          renderItem={({ item }) => (
            <Image source={item} style={styles.carouselImage} />
          )}
          sliderWidth={300}
          itemWidth={300}
        />
        <View style={styles.carouselIndicatorContainer}>
          {images.map((_, index) => (
            <View key={index} style={styles.carouselIndicator} />
          ))}
        </View> */}
        <View style={styles.carouselContainer}>
          <Carousel
            data={images}
            renderItem={({ item }) => (
              <Image source={{ uri: item.uri }} style={styles.carouselImage} />
            )}
            sliderWidth={300}
            itemWidth={300}
            // containerCustomStyle={{ height: 300 }}
            containerCustomStyle={styles.carouselContainer}
            onSnapToItem={(index) => setActiveSlide(index)}
            // loop={true}
            autoplay={true}
            autoplayDelay={5000}
          />
          <Pagination
            dotsLength={images.length}
            activeDotIndex={activeSlide}
            containerStyle={styles.carouselIndicatorContainer}
            dotStyle={styles.activeDot}
            inactiveDotStyle={styles.inactiveDot}
            inactiveDotOpacity={0.4}
            inactiveDotScale={0.6}
          />
        </View>
        <View style={styles.header}>
          <Text style={styles.themeName}>{themeName}</Text>
          {/* <Text style={styles.rating}>⭐ {rating}</Text> */}
          <TouchableOpacity style={styles.shareButton} onPress={onShare}>
            <Text style={styles.shareButtonText}>공유하기</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rating}>⭐ {rating}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.keywordsContainer}>
          {keywords.map((keyword, index) => (
            <View key={index} style={styles.keywordBubble}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.placesName}>장소명칭</Text>
        <ScrollView style={[styles.placesContainer, { height: 270 }]}>
          {places.map((place, index) => (
            <TouchableOpacity
              key={index}
              style={styles.placeBox}
              onPress={() => onPlacePress(place)}
            >
              <Image source={place.image} style={styles.placeImage} />
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddress}>{place.address}</Text>
              </View>
              <Text style={styles.placeArrow}>{">"}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.shareWithColleaguesButton}
          onPress={onShareWithColleagues}
        >
          <Text style={styles.shareWithColleaguesButtonText}>
            동료에게 여행 장소 공유하기
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: "black",
  },
  carouselImage: {
    width: 300,
    height: 200,
    borderRadius: 10,
  },
  carouselContainer: {
    // ...other styles
    height: 300,
    width: 300,
    // borderWidth: 1,
    bottom: -30,
  },
  carouselIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 0,
    bottom: 50,
    // borderWidth: 1,
    width: 300,
  },

  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "blue",
  },
  inactiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "lightgray",
  },
  // carouselIndicator: {
  //   width: 8,
  //   height: 8,
  //   borderRadius: 4,
  //   backgroundColor: "gray",
  //   marginHorizontal: 4,
  // },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginVertical: 10,
    // borderWidth: 1,
  },
  themeName: {
    fontSize: 18,
    fontWeight: "bold",
    // borderWidth: 1,
  },
  rating: {
    fontSize: 16,
    color: "gold",
    alignSelf: "flex-start",
    // borderWidth: 1,
    bottom: 10,
  },
  shareButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
  },
  shareButtonText: {
    color: "white",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginVertical: 10,
    alignSelf: "flex-start",
    // borderWidth: 1,
    bottom: 10,
  },

  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
    alignSelf: "flex-start",
    // borderWidth: 1,
    bottom: 10,
  },
  keywordBubble: {
    backgroundColor: "#f2f2f2",
    padding: 8,
    borderRadius: 15,
    margin: 5,
  },
  keywordText: {
    fontSize: 12,
    color: "#333",
  },
  placesName: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
    alignSelf: "flex-start",
    // borderWidth: 1,
    bottom: 10,
  },
  placesContainer: {
    width: "100%",
    marginVertical: 10,
    // borderWidth: 1,
    bottom: 10,
  },
  placeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    marginVertical: 5,
  },
  placeImage: {
    width: 80,
    height: 60,
    borderRadius: 5,
  },
  placeInfo: {
    flex: 1,
    marginLeft: 10,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  placeAddress: {
    fontSize: 12,
    color: "#666",
  },
  placeArrow: {
    fontSize: 25,
    color: "#007AFF",
  },
  shareWithColleaguesButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
  shareWithColleaguesButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default OptionModal;
