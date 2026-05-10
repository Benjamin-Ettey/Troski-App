import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAppStore} from "@/utils/store";

const Settings = () => {

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
                    onPress: ()=>router.replace("/onboarding/landingPage")
                }


            ]
        )

        deleteAccount();
    }
    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">
            <ScrollView>
                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Manage Notifications</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1}} onPress={()=>router.replace("/profile/notifications")} className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray">Notifications</Text>
                            <Ionicons style={{paddingRight: 16}} name="chevron-forward" size={18} color="gray"/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular"
                    >Receive transaction alerts and important account updates.</Text>
                </View>


                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">PIN Management</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1}} onPress={()=> router.replace("/profile/oldPinCode")} className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray">Change Pin Code</Text>
                            <Ionicons style={{paddingRight: 16}} name="chevron-forward" size={18} color="gray"/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular">Manage your PIN to secure access to your account and transactions.
                    </Text>
                </View>


                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Delete Account</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24, backgroundColor: "#EF4444"}} className="flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1, }}
                                          onPress={handleDeleteAccount}
                                          className="w-full flex flex-row justify-between items-center">
                            <Text style={{color: "white"}} className="font-GoogleSansMedium ">Delete Account</Text>
                            <Ionicons style={{paddingRight: 16}} name="trash-bin-outline" size={18} color="white"/>
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{paddingLeft: 10, marginTop: 5, color: "#ef4444"}}
                        className="text-xs font-GoogleSansRegular">Permanently delete your account and all associated data.</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Settings
