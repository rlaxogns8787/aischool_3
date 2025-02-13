// filepath: /c:/Users/USER/Downloads/3_project/travel/travel/react-native-snap-carousel.d.ts
declare module "react-native-snap-carousel" {
  import { Component } from "react";
  import { ViewStyle, StyleProp, FlatListProps } from "react-native";

  export interface CarouselProps<T> extends FlatListProps<T> {
    data: T[];
    renderItem: (info: { item: T; index: number }) => JSX.Element;
    sliderWidth: number;
    itemWidth: number;
    firstItem?: number;
    inactiveSlideScale?: number;
    inactiveSlideOpacity?: number;
    inactiveSlideShift?: number;
    containerCustomStyle?: StyleProp<ViewStyle>;
    contentContainerCustomStyle?: StyleProp<ViewStyle>;
    slideStyle?: StyleProp<ViewStyle>;
    activeSlideAlignment?: "start" | "center" | "end";
    onSnapToItem?: (index: number) => void;
    layout?: "default" | "stack" | "tinder";
    layoutCardOffset?: number;
    loop?: boolean;
    loopClonesPerSide?: number;
    autoplay?: boolean;
    autoplayDelay?: number;
    autoplayInterval?: number;
    enableMomentum?: boolean;
    lockScrollWhileSnapping?: boolean;
    enableSnap?: boolean;
    useScrollView?: boolean;
    scrollInterpolator?: (
      index: number,
      carouselProps: CarouselProps<T>
    ) => any;
    slideInterpolatedStyle?: (
      index: number,
      animatedValue: any,
      carouselProps: CarouselProps<T>
    ) => any;
  }

  export default class Carousel<T> extends Component<CarouselProps<T>> {}
}
