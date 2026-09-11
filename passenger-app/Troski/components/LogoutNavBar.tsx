import {View, Text, Alert, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAppStore} from "@/utils/store";

const LogoutNavBar = ({name, title} : any) => {
    const setLoggedIn = useAppStore((state)=>state.setLoggedIn);
    const setSeeProfile = useAppStore((state)=> state.setSeeProfile);

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
                        setLoggedIn(false);
                        setSeeProfile(false);
                        router.replace("/landingPage")
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
