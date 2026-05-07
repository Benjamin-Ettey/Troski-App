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

                        <Stack.Screen
                            name="myWallet"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'My wallet',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="settings"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Settings',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="oldPinCode"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Change pin code',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="newPinCode"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Change pin code',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="notifications"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Notifications',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="information"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Information',
                                headerLeft: ()=>(
                                    <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                        <Ionicons name="chevron-back" size={30} color="black"/>
                                    </TouchableOpacity>
                                )
                            })}
                        />

                        <Stack.Screen
                            name="recentEmails"
                            options={()=> ({
                                headerShadowVisible: false,
                                headerStyle: {backgroundColor: "#F5F7FA"},
                                headerTitle: 'Recent emails',
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
