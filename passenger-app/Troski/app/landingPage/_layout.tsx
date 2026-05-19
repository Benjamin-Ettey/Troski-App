import React from 'react'
import { Stack } from 'expo-router'
import {View} from "react-native";
import {useColorScheme} from "nativewind";

const LandingPageRoute = () => {
    const {colorScheme} = useColorScheme();
    return (
        <View style={{flex:1 , backgroundColor: colorScheme === "dark"? "#000000": "#ffffff"}}>

            <Stack>
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false,
                        gestureEnabled: false
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


            </Stack>
        </View>
    )
}
export default LandingPageRoute
