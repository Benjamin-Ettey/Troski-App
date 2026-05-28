import React, {Suspense} from 'react'
import {Stack} from "expo-router";
import {useFonts} from "expo-font";
import "../global.css"
import {ErrorBoundary} from "@/components/ui/ErrorBoundary";
import SuspenseFallback from "@/components/ui/SuspenseFallback";



const RootLayout = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loaded] = useFonts({
        "GoogleSans-Bold": require("../assets/fonts/GoogleSans-Bold.ttf"),
        "GoogleSans-Medium": require("../assets/fonts/GoogleSans-Medium.ttf"),
        "GoogleSans-Regular": require("../assets/fonts/GoogleSans-Regular.ttf"),
        "GoogleSans-SemiBold": require("../assets/fonts/GoogleSans-SemiBold.ttf"),
    });
    if (!loaded) return null;

    return (

        <ErrorBoundary>
            <Suspense fallback={<SuspenseFallback/>} >

                <Stack>
                    <Stack.Screen
                        name="index"
                        options={{
                            headerShown: false,
                        }}
                    />

                    <Stack.Screen
                        name="+not-found"
                        options={{
                            headerShown: false,
                            gestureEnabled: false,
                        }}
                    />

                    <Stack.Screen
                        name="login"
                        options={{
                            headerShown: false,
                        }}
                    />

                    <Stack.Screen
                        name="register"
                        options={{
                            headerShown: false,
                        }}
                    />

                    <Stack.Screen
                        name="approval"
                        options={{
                            headerShown: false,
                            gestureEnabled: false,
                        }}
                    />
                </Stack>
            </Suspense>
        </ErrorBoundary>

    )
}
export default RootLayout
