import React from 'react'
import {Stack} from "expo-router";
import {useFonts} from "expo-font";
import "../global.css"

const _Layout = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loaded] = useFonts({
        "GoogleSans-Bold": require("../assets/fonts/GoogleSans-Bold.ttf"),
        "GoogleSans-Medium": require("../assets/fonts/GoogleSans-Medium.ttf"),
        "GoogleSans-Regular": require("../assets/fonts/GoogleSans-Regular.ttf"),
        "GoogleSans-SemiBold": require("../assets/fonts/GoogleSans-SemiBold.ttf"),
    });
    if (!loaded) return null;

    return (
        <Stack>
            <Stack.Screen
                name="landingPage"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="signup"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="login"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="homepage"
                options={{
                    headerShown: false,
                    gestureEnabled: false

                }}
            />

            <Stack.Screen
                name="profile"
                options={{
                    headerShown: false
                }}
            />



        </Stack>

    )
}
export default _Layout
