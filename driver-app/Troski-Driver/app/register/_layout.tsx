import React from 'react'
import {Stack, useRouter} from "expo-router";
import {TouchableOpacity} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {KeyboardProvider} from "react-native-keyboard-controller";

const RegisterLayout = () => {
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
                        headerTitleAlign: "center",
                        headerTitle: 'Register',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color= "black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

            </Stack>
        </KeyboardProvider>
    )
}
export default RegisterLayout
