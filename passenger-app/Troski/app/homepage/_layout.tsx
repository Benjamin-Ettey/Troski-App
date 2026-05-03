import React from 'react'
import {Stack} from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";


const _Layout = () => {
    return (
        <GestureHandlerRootView>
            <BottomSheetModalProvider>
                <Stack>
                    <Stack.Screen
                        name="home"
                        options={{
                            headerShown: false
                        }}
                    />
                </Stack>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>

)
}
export default _Layout
