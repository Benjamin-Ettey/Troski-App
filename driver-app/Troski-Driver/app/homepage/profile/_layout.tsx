import React from 'react'
import {Stack, useRouter} from "expo-router";
import {TouchableOpacity} from "react-native";
import {Ionicons} from "@expo/vector-icons";

const ProfileLayout = () => {

    const router = useRouter();
    return (
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
                    headerTitle: 'Profile',
                    headerLeft: ()=>(
                        <TouchableOpacity onPress={()=>router.back()} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <Ionicons name="chevron-back" size={30} color= "black"/>
                        </TouchableOpacity>
                    )
                })}
            />

            <Stack.Screen
                name="editProfile"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="rideHistory"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="myWallet"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="settings"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="information"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="recentEmails"
                options={{
                    headerShown: false
                }}
            />


        </Stack>
    )
}
export default ProfileLayout
