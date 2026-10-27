import React, { useEffect, useRef } from "react";
import {
    View,
    Animated,
    Easing,
    useColorScheme,
} from "react-native";

const PaginateSuggestedDestination = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const fadeAnim = useRef(new Animated.Value(0.4)).current;
    const sweepAnim = useRef(new Animated.Value(-1)).current;

    useEffect(() => {
        const fade = Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.85,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0.4,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const sweep = Animated.loop(
            Animated.timing(sweepAnim, {
                toValue: 1,
                duration: 1400,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        fade.start();
        sweep.start();

        return () => {
            fade.stop();
            sweep.stop();
        };
    }, [fadeAnim, sweepAnim]);

    const skeletonColor = isDark ? "#292929" : "#E5E7EB";
    const highlightColor = isDark
        ? "rgba(255,255,255,0.12)"
        : "rgba(255,255,255,0.8)";

    const shimmerStyle = {
        backgroundColor: highlightColor,
        opacity: fadeAnim,
        transform: [
            {
                translateX: sweepAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-100, 200],
                }),
            },
        ],
    };

    const renderSkeletonRow = (index: number) => (
        <View
            key={index}
            className="py-4 px-6 flex-row items-center"
        >
            {/* Location icon placeholder */}
            <Animated.View
                style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: skeletonColor,
                    opacity: fadeAnim,
                    overflow: "hidden",
                }}
            >
                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            width: 12,
                        },
                        shimmerStyle,
                    ]}
                />
            </Animated.View>

            {/* Destination name, subtitle, and divider */}
            <View className="ml-3 flex-1">
                {/* Destination name */}
                <View
                    style={{
                        height: 18,
                        width: index % 2 === 0 ? "65%" : "50%",
                        borderRadius: 4,
                        backgroundColor: skeletonColor,
                        overflow: "hidden",
                    }}
                >
                    <Animated.View
                        style={[
                            {
                                height: "100%",
                                width: "45%",
                            },
                            shimmerStyle,
                        ]}
                    />
                </View>

                {/* Location subtitle */}
                <View
                    style={{
                        marginTop: 7,
                        height: 14,
                        width: index % 2 === 0 ? "45%" : "35%",
                        borderRadius: 4,
                        backgroundColor: skeletonColor,
                        overflow: "hidden",
                    }}
                >
                    <Animated.View
                        style={[
                            {
                                height: "100%",
                                width: "55%",
                            },
                            shimmerStyle,
                        ]}
                    />
                </View>

                {/* Bottom divider */}
                <View
                    style={{
                        width: "90%",
                        height: 2,
                        marginTop: 14,
                        backgroundColor: skeletonColor,
                        opacity: 0.5,
                    }}
                />
            </View>
        </View>
    );

    return (
        <View className="flex-1">
            {Array.from({ length: 5 }, (_, index) =>
                renderSkeletonRow(index)
            )}
        </View>
    );
};

export default PaginateSuggestedDestination;

