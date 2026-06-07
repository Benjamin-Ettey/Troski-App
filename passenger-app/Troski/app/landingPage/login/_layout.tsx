import {router, Stack} from 'expo-router'
import React from 'react'
import {KeyboardProvider} from "react-native-keyboard-controller";
import {TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const LoginRoute = () => {
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
                            headerTitle: 'Login',
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
                            headerTitle: 'Login',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color={colorScheme==="dark"? "white": "black"}/>
                                </TouchableOpacity>
                            )
                        })}
                    />

                    <Stack.Screen
                        name="forgotPassword"
                        options={{
                            headerShown: false
                        }}
                    />
                </Stack>
            </View>
        </KeyboardProvider>
    )
}
export default LoginRoute
