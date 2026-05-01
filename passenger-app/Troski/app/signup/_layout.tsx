import {View, Text} from 'react-native'
import React from 'react'
import {Stack} from "expo-router";
import {KeyboardProvider} from "react-native-keyboard-controller";

const _Layout = () => {
    return (
        <KeyboardProvider>
            <Stack>

                <Stack.Screen
                    name="emailScreen"
                    options={{
                        headerShown: false
                    }}

                />

                <Stack.Screen
                    name="phoneNumberScreen"
                    options={{
                        headerShown: false
                    }}

                />

                <Stack.Screen
                    name="pinScreen"
                    options={{
                        headerShown: false
                    }}

                />

                <Stack.Screen
                    name="confirmPinScreen"
                    options={{
                        headerShown: false
                    }}

                />


                <Stack.Screen
                    name="fullNameScreen"
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
