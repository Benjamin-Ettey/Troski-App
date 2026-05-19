import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppStore } from "@/utils/store";
import { VideoView, useVideoPlayer } from "expo-video";
import { useAudioPlayer } from "expo-audio";

const videoSource = require("../assets/video/splash.mp4");
const audioSource = require("../assets/audio/splashhorn.mp3");

const Splash: React.FC = () => {
    const loggedIn = useAppStore((state) => state.loggedIn);

    const player = useVideoPlayer(videoSource);
    const audioPlayer = useAudioPlayer(audioSource);


    const hasPlayedRef = useRef(false);


    useEffect(() => {
        if (hasPlayedRef.current) return;
        hasPlayedRef.current = true;

        const playVideo = async () => {
            try {
                await player.play();
            } catch (err) {
                console.warn("Video play failed:", err);
            }
        };

        playVideo();
    }, [player]);


    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                audioPlayer.play();
            } catch (err) {
                console.warn("Audio play failed:", err);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [audioPlayer]);


    useEffect(() => {
        const sub = player.addListener?.("playToEnd", () => {
            if (!loggedIn) {
                router.replace("/landingPage");
            } else {
                router.replace("/homepage");
            }
        });

        return () => {
            sub?.remove?.();
        };
    }, [player, loggedIn]);

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
            />
        </View>
    );
};

export default Splash;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
});