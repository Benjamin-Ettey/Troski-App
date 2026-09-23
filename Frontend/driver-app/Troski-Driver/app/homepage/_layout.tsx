import React from 'react'
import {Stack, useRouter} from "expo-router";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import {GestureHandlerRootView} from "react-native-gesture-handler";



const HomepageLayout = () => {

    return (
        <GestureHandlerRootView>

            <BottomSheetModalProvider>

                <Stack>
                    <Stack.Screen
                        name="index"
                        options={{
                            headerShown: false,
                            gestureEnabled: false,
                        }}
                    />

                    <Stack.Screen
                        name="profile"
                        options={{
                            headerShown: false
                        }}
                    />
                </Stack>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>


    )
}

export default HomepageLayout
