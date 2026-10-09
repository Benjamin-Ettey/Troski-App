// @ts-ignore

import {
    View,
    Animated,
    Easing,
    Modal,
} from "react-native";
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { StatusBar } from "expo-status-bar";
import MapView from "react-native-maps";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";


/*
|--------------------------------------------------------------------------
| SHARED SHIMMER (one loop drives every skeleton so they sweep in sync)
|--------------------------------------------------------------------------
*/

const ShimmerContext = createContext<Animated.Value | null>(null);


/*
|--------------------------------------------------------------------------
| SKELETON BLOCK
|--------------------------------------------------------------------------
*/

const Skeleton = ({
                      className = "",
                      style = {},
                  }: {
    className?: string;
    style?: any;
}) => {
    const shimmer = useContext(ShimmerContext)!;
    const { colorScheme } = useColorScheme();
    const [width, setWidth] = useState(0);

    const translateX = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, width || 120],
    });

    return (
        <View
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            className={`overflow-hidden bg-gray-200 dark:bg-secondaryGray/40 ${className}`}
            style={style}
        >
            <Animated.View
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: 120,
                    transform: [{ translateX }],
                    opacity: 0.7,
                    backgroundColor:
                        colorScheme === "dark"
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(255,255,255,0.75)",
                }}
            />
        </View>
    );
};


/*
|--------------------------------------------------------------------------
| SEARCH BAR SKELETON
|--------------------------------------------------------------------------
*/

const SearchBarSkeleton = () => {
    return (
        <View className="w-full bg-tertiaryWhite dark:bg-secondaryGray/40 h-14 px-6 flex flex-row gap-3 justify-start rounded-full items-center">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-md" />
        </View>
    );
};


/*
|--------------------------------------------------------------------------
| TRIP SKELETON
|--------------------------------------------------------------------------
*/

const TripSkeleton = () => {
    return (
        <View className="w-full h-20 rounded-3xl px-4 mb-4 bg-tertiaryWhite dark:bg-secondaryGray/40 flex-row justify-between items-center">

            {/* LEFT SIDE */}
            <View className="flex-row items-center gap-4 flex-1">

                {/* VEHICLE IMAGE */}
                <Skeleton className="w-9 h-9 rounded-full mx-2" />

                {/* TRIP INFORMATION */}
                <View className="flex-1">

                    {/* ROUTE */}
                    <View className="flex-row items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded-md" />
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                    </View>

                    {/* TIME + PASSENGERS */}
                    <View className="flex-row items-center mt-2">
                        <Skeleton className="h-4 w-12 rounded-full" />
                        <Skeleton className="h-4 w-10 rounded-md ml-3" />
                    </View>

                </View>
            </View>

            {/* PRICE */}
            <Skeleton className="h-9 w-24 rounded-full" />

        </View>
    );
};


/*
|--------------------------------------------------------------------------
| PAGINATION DOTS
|--------------------------------------------------------------------------
*/

const PaginationDot = ({ delay }: { delay: number }) => {
    const { colorScheme } = useColorScheme();
    const value = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(value, {
                    toValue: 1,
                    duration: 450,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(value, {
                    toValue: 0,
                    duration: 450,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.delay(600),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, []);

    const width = value.interpolate({
        inputRange: [0, 1],
        outputRange: [6, 20],
    });

    const opacity = value.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 1],
    });

    return (
        <Animated.View
            style={{
                width,
                height: 6,
                borderRadius: 10,
                opacity,
                backgroundColor: colorScheme === "dark" ? "#ffffff" : "#000000",
            }}
        />
    );
};


/*
|--------------------------------------------------------------------------
| SCREEN (pure loading state: no timer, no router)
| Loops until the parent stops rendering it.
|--------------------------------------------------------------------------
*/

const PaginateHomepage = () => {
    const { colorScheme } = useColorScheme();

    const snapPoints = useMemo(() => ["35%", "50%", "100%"], []);

    const shimmer = useRef(new Animated.Value(0)).current;


    /*
    |--------------------------------------------------------------------------
    | SHIMMER LOOP (runs forever, stops on unmount)
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmer, {
                toValue: 1,
                duration: 1400,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        );

        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
            }}
        >
            <Modal
                visible
                animationType="fade"
                presentationStyle="fullScreen"
                statusBarTranslucent
                onRequestClose={() => {}}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <ShimmerContext.Provider value={shimmer}>
                        <View style={{ flex: 1 }}>

                            <StatusBar style="auto" />


                            {/* =========================================================
                                MAP
                            ========================================================= */}

                            <MapView
                                style={{ flex: 1 }}
                                followsUserLocation={false}
                                showsUserLocation={false}
                                initialRegion={{
                                    latitude: 5.6037,
                                    longitude: -0.187,
                                    latitudeDelta: 0.05,
                                    longitudeDelta: 0.05,
                                }}
                            />


                            {/* =========================================================
                                TOP NAVIGATION
                            ========================================================= */}

                            <View
                                className="w-full flex flex-row justify-between items-center"
                                style={{
                                    position: "absolute",
                                    top: 60,
                                }}
                            >

                                {/* MENU */}
                                <View
                                    className="bg-white dark:bg-secondaryBlack"
                                    style={{
                                        padding: 10,
                                        borderRadius: 20,
                                        elevation: 5,
                                        left: 20,
                                    }}
                                >
                                    <Skeleton className="w-6 h-6 rounded-full" />
                                </View>

                                {/* RIGHT BUTTONS */}
                                <View
                                    className="flex flex-row bg-white dark:bg-secondaryBlack justify-between items-center rounded-full"
                                    style={{
                                        padding: 10,
                                        elevation: 5,
                                        right: 20,
                                        gap: 10,
                                    }}
                                >
                                    <Skeleton className="w-[22px] h-[22px] rounded-full" />
                                    <Skeleton className="w-6 h-6 rounded-full" />
                                </View>

                            </View>


                            {/* =========================================================
                                BOTTOM SHEET
                            ========================================================= */}

                            <BottomSheet
                                index={0}
                                snapPoints={snapPoints}
                                enablePanDownToClose={false}
                                backgroundStyle={{
                                    backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
                                }}
                                handleIndicatorStyle={{
                                    backgroundColor: "gray",
                                }}
                            >
                                <BottomSheetView>

                                    <View
                                        className="flex flex-col gap-4"
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                        }}
                                    >

                                        {/* SEARCH BAR */}
                                        <SearchBarSkeleton />


                                        {/* ROLLING TRIPS */}
                                        <View>

                                            {/* TITLE */}
                                            <View className="my-3">
                                                <Skeleton className="h-6 w-36 rounded-md" />
                                            </View>

                                            {/* TRIPS */}
                                            <TripSkeleton />
                                            <TripSkeleton />
                                            <TripSkeleton />

                                            {/* PAGINATION */}
                                            <View className="flex-row justify-center items-center mt-1 gap-2">
                                                <PaginationDot delay={0} />
                                                <PaginationDot delay={200} />
                                                <PaginationDot delay={400} />
                                            </View>

                                        </View>

                                    </View>

                                </BottomSheetView>
                            </BottomSheet>

                        </View>
                    </ShimmerContext.Provider>
                </GestureHandlerRootView>
            </Modal>
        </View>
    );
};

export default PaginateHomepage;