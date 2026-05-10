import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import {router, Stack} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

const _Layout = () => {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={()=> ({
                    headerShadowVisible: false,
                    headerStyle: {backgroundColor: "#F5F7FA"},
                    headerTitle: 'Information',
                    headerLeft: ()=>(
                        <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <Ionicons name="chevron-back" size={30} color="black"/>
                        </TouchableOpacity>
                    )
                })}
            />
        </Stack>
    )
}
export default _Layout
