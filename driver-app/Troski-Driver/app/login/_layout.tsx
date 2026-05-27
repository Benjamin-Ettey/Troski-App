import React from 'react'
import {Stack, useRouter} from "expo-router";
import {KeyboardProvider} from "react-native-keyboard-controller";
import {TouchableOpacity} from "react-native";
import {Ionicons} from "@expo/vector-icons";

const LandingPageRoute = () => {

    const router = useRouter();

    return (
        <KeyboardProvider>
            <Stack>
                <Stack.Screen
                    name="index"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {
                            backgroundColor: "#FFFFFF",
                        },
                        headerTintColor: "#000000",
                        headerTitle: 'Login',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color= "black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

                <Stack.Screen
                    name="pinScreen"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {
                            backgroundColor: "#FFFFFF",
                        },
                        headerTintColor: "#000000",
                        headerTitle: 'Login',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color= "black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

                <Stack.Screen
                    name="forgotPin"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </KeyboardProvider>
    )
}
export default LandingPageRoute
