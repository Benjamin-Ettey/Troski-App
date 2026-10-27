import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppStore } from "@/utils/store";
import { useAudioPlayer } from "expo-audio";
import { useColorScheme } from "nativewind";
import LottieView from "lottie-react-native";

const splashAnimation = require("../assets/video/splash.json");
const splashDarkAnimation = require("../assets/video/splashdark.json");
const audioSource = require("../assets/audio/splashhorn.mp3");

const Splash: React.FC = () => {
    const loggedIn = useAppStore((state) => state.loggedIn);
    const { colorScheme } = useColorScheme();

    const isDarkMode = colorScheme === "dark";
    const currentSplashAnimation = isDarkMode
        ? splashDarkAnimation
        : splashAnimation;

    const audioPlayer = useAudioPlayer(audioSource);
    const hasPlayedRef = useRef(false);

    useEffect(() => {
        if (hasPlayedRef.current) return;

        hasPlayedRef.current = true;

        const timer = setTimeout(() => {
            try {
                audioPlayer.play();
            } catch (err) {
                console.warn("Audio play failed:", err);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [audioPlayer]);

    const handleAnimationFinish = () => {
        if (loggedIn) {
            router.replace("/homepage");
        } else {
            router.replace("/landingPage");
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
                },
            ]}
        >
            <StatusBar hidden />

            <LottieView
                key={isDarkMode ? "dark-splash" : "light-splash"}
                source={currentSplashAnimation}
                autoPlay
                loop={false}
                onAnimationFinish={handleAnimationFinish}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
        </View>
    );
};

export default Splash;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

