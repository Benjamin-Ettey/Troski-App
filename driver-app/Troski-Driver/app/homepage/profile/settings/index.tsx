import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAppStore} from "@/utils/store";


const Index = () => {


    const deleteDriverAccount = useAppStore((state)=>state.deleteDriverAccount)

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

                        router.replace("/");
                    }
                }


            ]
        )

        deleteDriverAccount();
    }




    return (
        <View style={{backgroundColor:  "#F5F7FA"}} className="flex-1">
            <ScrollView className="py-2">
                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Manage Notifications</Text>
                    <View
                        style={{backgroundColor: "#ffffff"}}
                        className="flex justify-center items-center h-14 rounded-full px-5">
                        <TouchableOpacity
                            onPress={()=>router.push("/homepage/profile/settings/notifications")}
                            className="w-full flex-1 flex flex-row justify-between items-center">
                            <Text
                                className="font-GoogleSansMedium text-base leading-5 text-secondaryGray  ">Notifications</Text>
                            <Ionicons name="chevron-forward" size={18} color="gray"/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  "
                    >Receive transaction alerts and important account updates.</Text>
                </View>


                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">PIN Management</Text>
                    <View
                        style={{backgroundColor: "#ffffff"}}
                        className="flex justify-center items-center h-14 rounded-full px-5">
                        <TouchableOpacity style={{ flex:1}} onPress={()=> router.push("/homepage/profile/settings/changePinCode")}
                                          className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-base leading-5 text-secondaryGray">Change Pin Code</Text>
                            <Ionicons name="chevron-forward" size={18} color="gray"/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  "
                    >Manage your PIN to secure access to your account and transactions.
                    </Text>
                </View>



                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Delete Account</Text>
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
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  "
                    >Permanently delete your account and all associated data.</Text>
                </View>
            </ScrollView>




        </View>
    )
}
export default Index


