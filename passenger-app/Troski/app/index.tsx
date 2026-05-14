import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppStore } from "@/utils/store";
import { VideoView, useVideoPlayer } from "expo-video";

const Splash = () => {
    const loggedIn = useAppStore((s) => s.loggedIn);

    const player = useVideoPlayer(require("../assets/video/splash.mp4"), (p) => {
        p.play();
    });

    useEffect(() => {
        const sub = player.addListener("playToEnd", () => {
            if (!loggedIn) {
                router.replace("/landingPage");
            } else {
                router.replace("/homepage");
            }
        });

        return () => sub.remove();
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
});

export default Splash;
