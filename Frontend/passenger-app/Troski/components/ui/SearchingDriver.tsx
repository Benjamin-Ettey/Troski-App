
import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    Animated,
    Easing,
} from "react-native";

const SearchingDriver = () => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(progress, {
                    toValue: 1,
                    duration: 1600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(progress, {
                    toValue: 0,
                    duration: 1,
                    useNativeDriver: false,
                }),
            ])
        );

        animation.start();

        return () => {
            animation.stop();
            progress.stopAnimation();
        };
    }, [progress]);

    const animatedWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return (
        <View className="flex-1 w-full justify-center items-center px-8">
            <View className="w-full max-w-[280px] items-center">
                {/* Animated progress line */}
                <View
                    style={{
                        width: "100%",
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: "#ffcc0033",
                        overflow: "hidden",
                    }}
                >
                    <Animated.View
                        style={{
                            width: animatedWidth,
                            height: "100%",
                            backgroundColor: "#ffcc00",
                            borderRadius: 999,
                        }}
                    />
                </View>

                <Text className="font-GoogleSansMedium text-base text-secondaryBlack dark:text-general mt-6 text-center">
                    Searching for a driver
                </Text>

                <Text className="font-GoogleSansRegular text-sm text-secondaryGray dark:text-tertiaryGray mt-2 text-center">
                    Please be patient while we find a ride for you.
                </Text>
            </View>
        </View>
    );
};

export default SearchingDriver;