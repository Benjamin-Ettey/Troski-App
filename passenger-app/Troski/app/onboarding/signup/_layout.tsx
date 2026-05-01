import {View, Text} from 'react-native'
import React from 'react'
import {Stack} from "expo-router";
import {KeyboardProvider} from "react-native-keyboard-controller";

const _Layout = () => {
    return (
        <KeyboardProvider>
            <Stack>
                <Stack.Screen
                    name="signup"
                    options={{
                        headerShown: false
                    }}

                />
                <Stack.Screen
                    name="emailScreen"
                    options={{
                        headerShown: false
                    }}

                />
            </Stack>
        </KeyboardProvider>
    )
}
export default _Layout
