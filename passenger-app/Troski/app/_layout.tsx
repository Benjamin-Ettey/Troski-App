import React, {Suspense} from 'react'
import {Stack} from "expo-router";
import {useFonts} from "expo-font";
import "../global.css"
import {useAppStore} from "@/utils/store";
import {ErrorBoundary} from "@/components/ui/ErrorBoundary";
import SuspenseFallback from "@/components/ui/SuspenseFallback";
import {View} from "react-native";
import {useColorScheme} from "nativewind";
import { ThemeProvider} from "@/context/themeContext";

const RootLayout = () => {
    const loggedIn = useAppStore((state)=>state.loggedIn);
    const seeProfile = useAppStore((state)=>state.seeProfile);

    const {colorScheme} = useColorScheme();


    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loaded] = useFonts({
        "GoogleSans-Bold": require("../assets/fonts/GoogleSans-Bold.ttf"),
        "GoogleSans-Medium": require("../assets/fonts/GoogleSans-Medium.ttf"),
        "GoogleSans-Regular": require("../assets/fonts/GoogleSans-Regular.ttf"),
        "GoogleSans-SemiBold": require("../assets/fonts/GoogleSans-SemiBold.ttf"),
    });
    if (!loaded) return null;




    return (
        <ThemeProvider>


            <ErrorBoundary>
                <Suspense fallback={<SuspenseFallback/>} >
                    <View style={{flex:1 , backgroundColor: colorScheme === "dark"? "#000000": "#ffffff"}} >


                        <>
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


                            <Stack.Screen
                                name="+not-found"
                                options={{
                                    headerShown: false,
                                    gestureEnabled: false,
                                }}
                            />
                        </Stack>
                        </>
                    </View>
                </Suspense>
            </ErrorBoundary>
        </ThemeProvider>
    )
}
export default RootLayout
