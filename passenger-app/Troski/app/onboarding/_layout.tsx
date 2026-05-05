import React from 'react'
import { Stack } from 'expo-router'
import LandingPage from "@/app/onboarding/landingPage";

const _Layout = () => {
    return (
        <Stack>
            <Stack.Screen
                name="landingPage"
                options={{
                    headerShown: false,
                    gestureEnabled: false
                }}

            />


        </Stack>
    )
}
export default _Layout
