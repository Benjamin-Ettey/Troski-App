import {View, Text, ScrollView, TouchableOpacity, Alert, Switch} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAppStore} from "@/utils/store";
import {useColorScheme} from "nativewind";

const Notifications = () => {

    const notifications = useAppStore((state) => state.notifications);
    const toggleNotification = useAppStore((state) => state.toggleNotification);
    const resetNotifications = useAppStore((state)=> state.resetNotifications);
    const { colorScheme } = useColorScheme();


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
                    onPress: ()=>resetNotifications()
                }


            ]
        )
    }
    return (
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="flex-1">
            <ScrollView>
                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full py-2">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular dark:text-general">Ride Notifications</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}} className="flex flex-row justify-center items-center">
                        <TouchableOpacity
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray dark:text-tertiaryWhite">Ride Update Notifications</Text>
                            <Switch
                                value={notifications.rideUpdates}
                                onValueChange={()=>toggleNotification("rideUpdates")}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                style={{marginRight: 16}}/>

                        </TouchableOpacity>

                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular dark:text-tertiaryGray"
                    >Receive ride status updates and important trip notifications.</Text>
                </View>


                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular dark:text-general">Payment Notifications</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}} className="flex flex-row justify-center items-center">
                        <TouchableOpacity
                            style={{ flex:1}}
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray dark:text-tertiaryWhite">Payment Notifications</Text>
                            <Switch
                                value={notifications.paymentNotifications}
                                onValueChange={()=>toggleNotification("paymentNotifications")}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                style={{marginRight: 16}}/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular dark:text-tertiaryGray">Receive notifications for payments, deposits, and withdrawals.
                    </Text>
                </View>

                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular dark:text-general">Promotions & Announcements</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}} className="flex flex-row justify-center items-center">
                        <TouchableOpacity
                            style={{ flex:1}}
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray dark:text-tertiaryWhite">Announcements</Text>
                            <Switch
                                value={notifications.announcements}
                                onValueChange={()=>toggleNotification("announcements")}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                style={{marginRight: 16}}/>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{paddingLeft: 10, marginTop: 5}}
                        className="text-xs font-GoogleSansRegular dark:text-tertiaryGray">Receive updates on offers, promotions, and important announcements.
                    </Text>
                </View>

                <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular dark:text-general">Reset Notifications</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}} className="flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1, }}
                                          onPress={handleResetNotification}
                                          className="w-full flex flex-row justify-between items-center">
                            <Text style={{color: "#ff0000"}} className="font-GoogleSansMedium ">Reset all notifications</Text>
                            <Ionicons style={{paddingRight: 16}} name="trash-bin-outline" size={18} color="#ff0000"/>
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{paddingLeft: 10, marginTop: 5, color: "#ff0000"}}
                        className="text-xs font-GoogleSansRegular">Reset all notification settings to default values.</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Notifications
