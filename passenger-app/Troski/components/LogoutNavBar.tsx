import {View, Text, Pressable} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";

const LogoutNavBar = ({name, title} : any) => {
    const handleLogout= ()=>{
        router.replace("../login/phoneNumberScreen")
    }

    return (
        <Pressable
            onPress={handleLogout}
            style={{paddingHorizontal: 16, paddingVertical: 16,}}
            className="flex flex-row justify-between items-center">
            <View className="flex flex-row justify-start items-center gap-4">
                <Ionicons name={name} size={20} color="red"/>
                <Text
                    style={{color: "red"}}
                    className="font-GoogleSansRegular ">{title}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="red"/>
        </Pressable>
    )
}
export default LogoutNavBar
