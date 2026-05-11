import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {router, Stack} from "expo-router";
import {KeyboardProvider} from "react-native-keyboard-controller";
import {Ionicons} from "@expo/vector-icons";

const _Layout = () => {
    return (
        <KeyboardProvider>
            <Stack>

                <Stack.Screen
                    name="index"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Create Account',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color="black"/>
                            </TouchableOpacity>
                        )
                    })}

                />

                <Stack.Screen
                    name="phoneNumberScreen"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Create Account',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color="black"/>
                            </TouchableOpacity>
                        )
                    })}

                />

                <Stack.Screen
                    name="pinScreen"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Create Account',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color="black"/>
                            </TouchableOpacity>
                        )
                    })}

                />

                <Stack.Screen
                    name="confirmPinScreen"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Create Account',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color="black"/>
                            </TouchableOpacity>
                        )
                    })}

                />


                <Stack.Screen
                    name="fullNameScreen"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Create Account',
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
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Create Account',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color="black"/>
                            </TouchableOpacity>
                        )
                    })}

                />
            </Stack>
        </KeyboardProvider>
    )
}
export default _Layout
