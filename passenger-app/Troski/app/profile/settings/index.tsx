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
                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular dark:text-general">Manage Notifications</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}} className="flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1}} onPress={()=>router.push("/profile/settings/notifications")} className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray dark:text-tertiaryWhite">Notifications</Text>
                            <Ionicons style={{paddingRight: 16}} name="chevron-forward" size={18} color="gray"/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular dark:text-tertiaryGray"
                    >Receive transaction alerts and important account updates.</Text>
                </View>


                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular dark:text-general">PIN Management</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}} className="flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1}} onPress={()=> router.push("/profile/settings/changePinCode")} className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray dark:text-tertiaryWhite">Change Pin Code</Text>
                            <Ionicons style={{paddingRight: 16}} name="chevron-forward" size={18} color="gray"/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular dark:text-tertiaryGray">Manage your PIN to secure access to your account and transactions.
                    </Text>
                </View>


                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular dark:text-general">Delete Account</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24, backgroundColor: "#EF4444"}} className="flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1, }}
                                          onPress={handleDeleteAccount}
                                          className="w-full flex flex-row justify-between items-center">
                            <Text style={{color: "white"}} className="font-GoogleSansMedium dark:text-tertiaryWhite">Delete Account</Text>
                            <Ionicons style={{paddingRight: 16}} name="trash-bin-outline" size={18} color="white"/>
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{paddingLeft: 10, marginTop: 5, color: "#ef4444"}}
                        className="text-xs font-GoogleSansRegular dark:text-tertiaryWhite">Permanently delete your account and all associated data.</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Index
