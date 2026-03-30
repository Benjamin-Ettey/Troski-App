import React from 'react'
import {Stack} from "expo-router";
import {useFonts} from "expo-font";
import "../global.css"


const _Layout = () => {
    const [loaded] = useFonts({
        "Manrope-Bold": require("../assets/fonts/Manrope-Bold.ttf"),
        "Manrope-ExtraBold": require("../assets/fonts/Manrope-ExtraBold.ttf"),
        "Manrope-ExtraLight": require("../assets/fonts/Manrope-ExtraLight.ttf"),
        "Manrope-Light": require("../assets/fonts/Manrope-Light.ttf"),
        "Manrope-Medium": require("../assets/fonts/Manrope-Medium.ttf"),
        "Manrope-Regular": require("../assets/fonts/Manrope-Regular.ttf"),
        "Manrope-SemiBold": require("../assets/fonts/Manrope-SemiBold.ttf"),
    });

    return (
        <Stack/>

    )
}
export default _Layout
