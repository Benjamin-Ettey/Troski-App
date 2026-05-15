import React from 'react'
import {router, Stack} from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import {TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";


const HomepageRoute = () => {

    const { colorScheme } = useColorScheme();

    return (
        <GestureHandlerRootView>
            <BottomSheetModalProvider>
                <View style={{flex:1 , backgroundColor: colorScheme === "dark"? "#000000": "#ffffff"}}>

                    <Stack>
                        <Stack.Screen
                            name="index"
                            options={{
                                headerShown: false,
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
                                headerStyle: {
                                    backgroundColor:
                                        colorScheme === "dark" ? "#000000" : "#F5F7FA",
                                },
                                headerTintColor:
                                    colorScheme === "dark" ? "#FFFFFF" : "#000000",
                                headerTitle: 'Recent notifications',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                    </Stack>
                </View>

            </BottomSheetModalProvider>
        </GestureHandlerRootView>

)
}
export default HomepageRoute
