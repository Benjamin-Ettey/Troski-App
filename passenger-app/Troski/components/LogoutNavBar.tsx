import {View, Text, Pressable, Alert} from 'react-native'
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
