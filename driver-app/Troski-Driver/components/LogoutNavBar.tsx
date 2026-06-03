import {View, Text, Alert, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";

const LogoutNavBar = ({name, title} : any) => {

    const router = useRouter();


    const handleLogout= ()=>{
        Alert.alert(
            "Logout?", "You are about to log out of your account. You will need to sign in again to continue.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: ()=> {
                        router.replace("/")
                    }
                }


            ]
        )


    }

    return (
        <TouchableOpacity
            onPress={handleLogout}
            className="flex flex-row justify-between h-14 px-4 items-center">
            <View className="flex flex-row justify-center items-center gap-4">
                <Ionicons name={name} size={18} color="#dc2626"/>
                <Text
                    className="font-GoogleSansMedium text-red-600 text-base leading-5">{title}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#dc2626"/>
        </TouchableOpacity>
    )
}
export default LogoutNavBar
