import {router, Stack} from 'expo-router'
import React from 'react'
import {KeyboardProvider} from "react-native-keyboard-controller";
import {TouchableOpacity} from "react-native";
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
                        headerTitle: 'Login',
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
                        headerTitle: 'Login',
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
