import React, { useEffect, useRef } from "react";
import {
    View,
    Animated,
    Easing,
} from "react-native";
import { useColorScheme } from "nativewind";

const PaginateRollingTrips = () => {
    const { colorScheme } = useColorScheme();

    const translateX = useRef(new Animated.Value(-250)).current;
    const opacity = useRef(new Animated.Value(0.5)).current;

    const skeletonColor =
        colorScheme === "dark" ? "#383838" : "#E5E5E5";

    const highlightColor =
        colorScheme === "dark" ? "#505050" : "#F5F5F5";

    useEffect(() => {
        const sweepAnimation = Animated.loop(
            Animated.timing(translateX, {
                toValue: 350,
                duration: 1300,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        const fadeAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 650,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: 650,
                    useNativeDriver: true,
                }),
            ])
        );

        sweepAnimation.start();
        fadeAnimation.start();

        return () => {
            sweepAnimation.stop();
            fadeAnimation.stop();
        };
    }, [translateX, opacity]);

    const SkeletonBlock = ({
        width,
        height,
        radius = 8,
    }: {
        width: number | `${number}%`;
        height: number;
        radius?: number;
    }) => (
        <View
            style={{
                width,
                height,
                borderRadius: radius,
                backgroundColor: skeletonColor,
                overflow: "hidden",
            }}
        >
            <Animated.View
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: 45,
                    backgroundColor: highlightColor,
                    opacity,
                    transform: [{ translateX }],
                }}
            />
        </View>
    );

    const renderSkeletonCard = (index: number) => (
        <View
            key={index}
            className="w-full h-20 rounded-3xl px-4 mb-4 gap-4 bg-tertiaryWhite dark:bg-secondaryGray/40 flex flex-col justify-center items-center"
        >
            <View className="flex w-full flex-row justify-between items-center gap-3">
                <View className="flex-row flex gap-2 flex-1 min-w-0 justify-start items-center">
                    {/* Minibus image placeholder */}
                    <View className="w-24 h-16 justify-center">
                        <SkeletonBlock width={88} height={42} radius={10} />
                    </View>

                    {/* Destination and trip details */}
                    <View className="flex flex-col flex-1 min-w-0 gap-2">
                        <SkeletonBlock width="85%" height={17} radius={5} />

                        <View className="w-full flex flex-row justify-start items-center gap-2">
                            <SkeletonBlock width={48} height={12} radius={5} />
                            <SkeletonBlock width={30} height={12} radius={5} />
                        </View>
                    </View>
                </View>

                {/* Price placeholder */}
                <View className="rounded-full h-9 w-24 shrink-0 bg-primary/20 dark:bg-secondaryBlack flex justify-center items-center">
                    <SkeletonBlock width={52} height={15} radius={5} />
                </View>
            </View>
        </View>
    );

    return (
        <View className="w-full">
            {Array.from({ length: 4 }).map((_, index) =>
                renderSkeletonCard(index)
            )}
        </View>
    );
};

export default PaginateRollingTrips;
