import {TouchableOpacity} from 'react-native'
import React from 'react'
import {router, Stack} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {KeyboardProvider} from "react-native-keyboard-controller";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";

const _Layout = () => {



    return (
        <GestureHandlerRootView>
            <BottomSheetModalProvider>


                <KeyboardProvider>
                    <Stack>
                        <Stack.Screen
                            name="index"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#ffffff"},
                                headerTitle: 'Route',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />



                        <Stack.Screen
                            name="selectRide"
                            options={()=> ({
                                headerShown: false
                            })}
                        />

                        <Stack.Screen
                            name="numberOfPassengers"
                            options={()=> ({
                                headerShown: false
                            })}
                        />

                        <Stack.Screen
                            name="selectPaymentMethod"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Select payment method',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />



                        <Stack.Screen
                            name="searchDriver"
                            options={()=> ({
                                headerShown: false,
                                gestureEnabled: false,
                                headerBackVisible: false
                            })}
                        />

                        <Stack.Screen
                            name="whyCancelRide"
                            options={()=> ({
                                headerShown: false,
                                gestureEnabled: false,
                                headerBackVisible: false
                            })}
                        />


                    </Stack>
                </KeyboardProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    )
}
export default _Layout
