import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {KeyboardProvider} from "react-native-keyboard-controller";
import {useColorScheme} from "nativewind";
import {router, Stack} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

const ForgotPasswordLayout = () => {
    const {colorScheme} =  useColorScheme();

    return (
        <KeyboardProvider>
            <View style={{flex:1 , backgroundColor: colorScheme === "dark"? "#000000": "#ffffff"}}>

                <Stack>
                    <Stack.Screen
                        name="index"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor:
                                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                            },
                            headerTintColor:
                                colorScheme === "dark" ? "#FFFFFF" : "#000000",
                            headerTitle: 'Forgot password',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}
                    />

                    <Stack.Screen
                        name="otpScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor:
                                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                            },
                            headerTintColor:
                                colorScheme === "dark" ? "#FFFFFF" : "#000000",
                            headerTitle: 'Forgot password',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}
                    />

                    <Stack.Screen
                        name="newPinScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor:
                                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                            },
                            headerTintColor:
                                colorScheme === "dark" ? "#FFFFFF" : "#000000",
                            headerTitle: 'Forgot password',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}
                    />

                    <Stack.Screen
                        name="confirmNewPinScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor:
                                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                            },
                            headerTintColor:
                                colorScheme === "dark" ? "#FFFFFF" : "#000000",
                            headerTitle: 'Forgot password',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}
                    />
                </Stack>

            </View>
        </KeyboardProvider>

    )
}
export default ForgotPasswordLayout
