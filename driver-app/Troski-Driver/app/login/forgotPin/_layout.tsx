import {View, TouchableOpacity} from 'react-native'
import React from 'react'
import {KeyboardProvider} from "react-native-keyboard-controller";
import {router, Stack} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

const ForgotPinLayout = () => {

    return (
        <KeyboardProvider>
            <View style={{flex:1 , backgroundColor: "#ffffff"}}>

                <Stack>
                    <Stack.Screen
                        name="index"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor: "#FFFFFF",
                            },
                            headerTintColor: "#000000",
                            headerTitleAlign: "center",
                            headerTitle: 'Forgot pin',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color="black"/>
                                </TouchableOpacity>
                            )
                        })}
                    />

                    <Stack.Screen
                        name="otpScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor: "#FFFFFF",
                            },
                            headerTintColor: "#000000",
                            headerTitle: 'Forgot pin',
                            headerTitleAlign: "center",
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color="black"/>
                                </TouchableOpacity>
                            )
                        })}
                    />

                    <Stack.Screen
                        name="newPinScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor: "#FFFFFF",
                            },
                            headerTintColor: "#000000",
                            headerTitleAlign: "center",
                            headerTitle: 'Forgot pin',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color="black"/>
                                </TouchableOpacity>
                            )
                        })}
                    />

                    <Stack.Screen
                        name="confirmNewPinScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor: "#FFFFFF",
                            },
                            headerTintColor: "#000000",
                            headerTitleAlign: "center",
                            headerTitle: 'Forgot pin',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color="black"/>
                                </TouchableOpacity>
                            )
                        })}
                    />
                </Stack>

            </View>
        </KeyboardProvider>

    )
}
export default ForgotPinLayout
