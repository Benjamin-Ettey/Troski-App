import React from 'react'
import {Stack} from "expo-router";

const ApprovalLayout = () => {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
        </Stack>
    )
}
export default ApprovalLayout
