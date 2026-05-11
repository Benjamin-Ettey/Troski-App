import { View, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {StatusBar} from "expo-status-bar";
import {useAppStore} from "@/utils/store";
import OtpModal from "@/components/ui/OtpModal";

const Index = () => {
    const loggedIn = useAppStore((state)=>state.loggedIn);
    const setLoggedIn = useAppStore((state)=>state.setLoggedIn);
    const setSeeProfile = useAppStore((state)=> state.setSeeProfile);

    const player = useVideoPlayer(require("../assets/video/splash.mp4"), (player) => {
        player.play(); // autoplay
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loggedIn){
                router.replace("/landingPage")
            }else{
                router.replace("/homepage")

            }
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar hidden/>
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black", // fallback background
    },
});

export default Index;
