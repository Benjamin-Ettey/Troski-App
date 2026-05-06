import React from 'react'
import {router, Stack} from "expo-router";
import {TouchableOpacity} from "react-native";
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
                            name="profileScreen"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Profile',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="editProfile"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Edit profile',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="rideHistory"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Ride history',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="paymentMethod"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Payment method',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="setupPaymentMethod"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Setup payment method',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="changeNumberInfo"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Change phone number',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="changePhoneNumber"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Change phone number',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="otpChangePhoneNumber"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Change phone number',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />
                    </Stack>
                </KeyboardProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    )
}
export default _Layout
