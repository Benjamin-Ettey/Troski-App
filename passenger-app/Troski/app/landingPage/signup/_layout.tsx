import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {router, Stack} from "expo-router";
import {KeyboardProvider} from "react-native-keyboard-controller";
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const SignupRoute = () => {
    const {colorScheme} = useColorScheme();


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
                            headerTitle: 'Create Account',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}

                    />

                    <Stack.Screen
                        name="phoneNumberScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor:
                                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                            },
                            headerTintColor:
                                colorScheme === "dark" ? "#FFFFFF" : "#000000",
                            headerTitle: 'Create Account',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}

                    />

                    <Stack.Screen
                        name="pinScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor:
                                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                            },
                            headerTintColor:
                                colorScheme === "dark" ? "#FFFFFF" : "#000000",
                            headerTitle: 'Create Account',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}

                    />

                    <Stack.Screen
                        name="confirmPinScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor:
                                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                            },
                            headerTintColor:
                                colorScheme === "dark" ? "#FFFFFF" : "#000000",
                            headerTitle: 'Create Account',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}

                    />


                    <Stack.Screen
                        name="fullNameScreen"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor:
                                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                            },
                            headerTintColor:
                                colorScheme === "dark" ? "#FFFFFF" : "#000000",
                            headerTitle: 'Create Account',
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
                            headerTitle: 'Create Account',
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
export default SignupRoute
