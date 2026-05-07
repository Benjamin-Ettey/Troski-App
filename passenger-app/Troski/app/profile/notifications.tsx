import {View, Text, ScrollView, TouchableOpacity, Alert, Switch} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";

const Notifications = () => {

    const [isEnabledRideUpdate, setIsEnabledRideUpdate] = useState(true);
    const [isEnabledPaymentNotifications, setIsEnabledPaymentNotifications] = useState(true);
    const [isEnabledAnnouncements, setIsEnabledAnnouncements] = useState(false);

    const toggleSwitchRideUpdate = ()=> setIsEnabledRideUpdate(previous=>!previous)
    const toggleSwitchPaymentNotifications = ()=> setIsEnabledPaymentNotifications(previous=>!previous)
    const toggleSwitchAnnouncements = ()=> setIsEnabledAnnouncements(previous=>!previous)



    const handleResetNotification = ()=>{
        Alert.alert(
            "Reset all notifications?", "This action will reset al your notifications to default.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: ()=>router.replace("/profile/settings")
                }


            ]
        )
    }
    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">
            <ScrollView>
                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Ride Notifications</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex flex-row justify-center items-center">
                        <TouchableOpacity
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray">Ride Update Notifications</Text>
                            <Switch
                                value={isEnabledRideUpdate}
                                onValueChange={toggleSwitchRideUpdate}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                style={{marginRight: 16}}/>

                        </TouchableOpacity>

                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular"
                    >Receive ride status updates and important trip notifications.</Text>
                </View>


                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Payment Notifications</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex flex-row justify-center items-center">
                        <TouchableOpacity
                            style={{ flex:1}} onPress={()=> router.replace("/profile/oldPinCode")}
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray">Payment Notifications</Text>
                            <Switch
                                value={isEnabledPaymentNotifications}
                                onValueChange={toggleSwitchPaymentNotifications}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                style={{marginRight: 16}}/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular">Receive notifications for payments, deposits, and withdrawals.
                    </Text>
                </View>

                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Promotions & Announcements</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex flex-row justify-center items-center">
                        <TouchableOpacity
                            style={{ flex:1}} onPress={()=> router.replace("/profile/oldPinCode")}
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray">Announcements</Text>
                            <Switch
                                value={isEnabledAnnouncements}
                                onValueChange={toggleSwitchAnnouncements}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                style={{marginRight: 16}}/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular">Receive updates on offers, promotions, and important announcements.
                    </Text>
                </View>

                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Reset Notifications</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1, }}
                                          onPress={handleResetNotification}
                                          className="w-full flex flex-row justify-between items-center">
                            <Text style={{color: "#ff0000"}} className="font-GoogleSansMedium ">Reset all notifications</Text>
                            <Ionicons style={{paddingRight: 16}} name="trash-bin-outline" size={18} color="#ff0000"/>
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{paddingLeft: 10, marginTop: 5, color: "#ff0000"}}
                        className="text-xs font-GoogleSansRegular">Permanently delete your account and all associated data.</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Notifications
