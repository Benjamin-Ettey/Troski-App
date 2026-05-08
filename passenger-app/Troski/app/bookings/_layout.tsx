import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {router, Stack} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {KeyboardProvider} from "react-native-keyboard-controller";

const _Layout = () => {
    return (
        <KeyboardProvider>
            <Stack>
                <Stack.Screen
                    name="searchRides"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Route',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color="black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

                <Stack.Screen
                    name="selectPickupPoint"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Select pickup point',
                        headerLeft: ()=>(
                            <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <Ionicons name="chevron-back" size={30} color="black"/>
                            </TouchableOpacity>
                        )
                    })}
                />

                <Stack.Screen
                    name="selectDestination"
                    options={()=> ({
                        headerShadowVisible: false,
                        headerStyle: {backgroundColor: "#ffffff"},
                        headerTitle: 'Select destination',
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
