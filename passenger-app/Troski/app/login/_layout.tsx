import {Stack} from 'expo-router'
import React from 'react'
import {KeyboardProvider} from "react-native-keyboard-controller";

const _Layout = () => {
    return (
        <KeyboardProvider>
            <Stack>
                <Stack.Screen
                    name="phoneNumberScreen"
                    options={{
                        headerShown: false
                    }}
                />

                <Stack.Screen
                    name="otpScreen"
                    options={{
                        headerShown: false
                    }}
                />
            </Stack>
        </KeyboardProvider>
    )
}
export default _Layout
