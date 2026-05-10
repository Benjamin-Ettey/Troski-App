import React from 'react'
import {router, Stack} from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import {TouchableOpacity} from "react-native";
import {Ionicons} from "@expo/vector-icons";


const _Layout = () => {
    return (
        <GestureHandlerRootView>
            <BottomSheetModalProvider>
                <Stack>
                    <Stack.Screen
                        name="index"
                        options={{
                            headerShown: false
                        }}
                    />

                    <Stack.Screen
                        name="bookings"
                        options={{
                            headerShown: false
                        }}
                    />

                    <Stack.Screen
                        name="recentNotifications"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {backgroundColor: "#F5F7FA"},
                            headerTitle: 'Recent notifications',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color="black"/>
                                </TouchableOpacity>
                            )
                        })}
                    />
                </Stack>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>

)
}
export default _Layout
