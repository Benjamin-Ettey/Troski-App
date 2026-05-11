import React from 'react'
import {Stack} from "expo-router";
import {useFonts} from "expo-font";
import "../global.css"
import {useAppStore} from "@/utils/store";

const RootLayout = () => {
    const loggedIn = useAppStore((state)=>state.loggedIn);
    const seeProfile = useAppStore((state)=>state.seeProfile);


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
                name="index"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Protected guard={!loggedIn}>
                <Stack.Screen
                    name="landingPage"
                    options={{
                        headerShown: false
                    }}
                />


            </Stack.Protected>

            <Stack.Protected guard={loggedIn && seeProfile}>


                <Stack.Screen
                    name="homepage"
                    options={{
                        headerShown: false,
                        gestureEnabled: false

                    }}
                />


            </Stack.Protected>

            <Stack.Protected guard={seeProfile}>
                <Stack.Screen
                    name="profile"
                    options={{
                        headerShown: false
                    }}
                />
            </Stack.Protected>

        </Stack>

    )
}
export default RootLayout
