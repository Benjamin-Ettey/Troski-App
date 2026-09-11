import {View, TouchableOpacity} from 'react-native'
import React from 'react'
import {router, Stack} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {KeyboardProvider} from "react-native-keyboard-controller";

const InformationRoute = () => {


    return (
        <KeyboardProvider>

            <View  style={{flex:1 , backgroundColor:  "#ffffff"}}>

                <Stack>
                    <Stack.Screen
                        name="index"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor: "#F5F7FA",
                            },
                            headerTintColor: "#000000",
                            headerTitleAlign: "center",
                            headerTitle: 'Information',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color="black"/>
                                </TouchableOpacity>
                            )
                        })}
                    />


                    <Stack.Screen
                        name="helpCenter"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor: "#F5F7FA",
                            },
                            headerTintColor: "#000000",
                            headerTitleAlign: "center",
                            headerTitle: 'Help Center',
                            headerLeft: ()=>(
                                <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <Ionicons name="chevron-back" size={30} color="black"/>
                                </TouchableOpacity>
                            )
                        })}
                    />


                    <Stack.Screen
                        name="sendFeedback"
                        options={()=> ({
                            headerShadowVisible: false,
                            headerStyle: {
                                backgroundColor: "#F5F7FA",
                            },
                            headerTintColor: "#000000",
                            headerTitleAlign: "center",
                            headerTitle: 'Send Feedback',
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
export default InformationRoute
