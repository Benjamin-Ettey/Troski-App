import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAppStore} from "@/utils/store";
import {useColorScheme} from "nativewind";

const Index = () => {
    const setLoggedIn = useAppStore((state)=>state.setLoggedIn);
    const setSeeProfile = useAppStore((state)=> state.setSeeProfile);
    const { colorScheme } = useColorScheme();


    const deleteAccount = useAppStore((state)=>state.deleteAccount)

    const handleDeleteAccount = ()=>{
        Alert.alert(
            "Delete Account?", "You are about to permanently delete your account and all associated data. This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: ()=> {
                        setLoggedIn(false);
                        setSeeProfile(false);
                        router.replace("/landingPage");
                    }
                }


            ]
        )

        deleteAccount();
    }
    return (
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="flex-1">
            <ScrollView className="py-2">
                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack dark:text-general">Manage Notifications</Text>
                    <View
                        style={{backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                        className="flex justify-center items-center h-14 rounded-full px-5">
                        <TouchableOpacity
                            onPress={()=>router.push("/profile/settings/notifications")}
                            className="w-full flex-1 flex flex-row justify-between items-center">
                            <Text
                                className="font-GoogleSansMedium text-base leading-5 text-secondaryGray  dark:text-general">Notifications</Text>
                            <Ionicons name="chevron-forward" size={18} color="gray"/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  dark:text-tertiaryGray"
                    >Receive transaction alerts and important account updates.</Text>
                </View>


                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack dark:text-general">PIN Management</Text>
                    <View
                        style={{backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                        className="flex justify-center items-center h-14 rounded-full px-5">
                        <TouchableOpacity style={{ flex:1}} onPress={()=> router.push("/profile/settings/changePinCode")} className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-base leading-5 text-secondaryGray  dark:text-general">Change Pin Code</Text>
                            <Ionicons name="chevron-forward" size={18} color="gray"/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  dark:text-tertiaryGray"
                    >Manage your PIN to secure access to your account and transactions.
                    </Text>
                </View>


                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack dark:text-general">Delete Account</Text>
                    <View
                        style={{backgroundColor: "#EF4444"}}
                        className="flex justify-center items-center h-14 rounded-full px-5">
                        <TouchableOpacity
                                          onPress={handleDeleteAccount}
                                          className="w-full flex-1 flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-base leading-5 text-general ">Delete Account</Text>
                            <Ionicons  name="trash-bin-outline" size={18} color="white"/>
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{color: "#ef4444"}}
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  dark:text-tertiaryGray"
                    >Permanently delete your account and all associated data.</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Index
