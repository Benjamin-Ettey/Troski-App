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

                <Stack.Screen
                    name="identityVerification"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {
                            backgroundColor: "#FFFFFF",
                        },
                        headerTintColor: "#000000",
                        headerTitleAlign: "center",
                        headerTitle: 'Identity verification',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color= "black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

                <Stack.Screen
                    name="verificationChecklist"
                    options={()=> ({
                        headerShown: false
                    })}
                />

                <Stack.Screen
                    name="vehicleDetails"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {
                            backgroundColor: "#FFFFFF",
                        },
                        headerTintColor: "#000000",
                        headerTitleAlign: "center",
                        headerTitle: 'Vehicle details',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color= "black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

                <Stack.Screen
                    name="vehicleDocuments"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {
                            backgroundColor: "#FFFFFF",
                        },
                        headerTintColor: "#000000",
                        headerTitleAlign: "center",
                        headerTitle: 'Vehicle documents',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color= "black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

                <Stack.Screen
                    name="routePreference"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {
                            backgroundColor: "#FFFFFF",
                        },
                        headerTintColor: "#000000",
                        headerTitleAlign: "center",
                        headerTitle: 'Route preference',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color= "black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

                <Stack.Screen
                    name="setupPayment"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {
                            backgroundColor: "#FFFFFF",
                        },
                        headerTintColor: "#000000",
                        headerTitleAlign: "center",
                        headerTitle: 'Setup payment',
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
