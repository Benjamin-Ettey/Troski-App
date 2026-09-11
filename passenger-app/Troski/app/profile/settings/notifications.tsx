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
                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack dark:text-general">Ride Notifications</Text>
                    <View
                        style={{backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                        className="flex justify-center items-center h-14 rounded-full px-5">
                        <TouchableOpacity
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray dark:text-tertiaryWhite">Ride Update Notifications</Text>
                            <Switch
                                value={notifications.rideUpdates}
                                onValueChange={()=>toggleNotification("rideUpdates")}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                />

                        </TouchableOpacity>

                    </View>
                    <Text
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  dark:text-tertiaryGray"
                    >Receive ride status updates and important trip notifications.</Text>
                </View>


                <View className="w-full mb-6 px-5">
                    <Text className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack dark:text-general">Payment Notifications</Text>
                    <View style={{backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                          className="flex flex-row rounded-full px-5 justify-center h-14 items-center">
                        <TouchableOpacity
                            style={{ flex:1}}
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray dark:text-tertiaryWhite">Payment Notifications</Text>
                            <Switch
                                value={notifications.paymentNotifications}
                                onValueChange={()=>toggleNotification("paymentNotifications")}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                />
                        </TouchableOpacity>
                    </View>
                    <Text
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  dark:text-tertiaryGray"
                    >Receive notifications for payments, deposits, and withdrawals.
                    </Text>
                </View>

                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack dark:text-general">Promotions & Announcements</Text>
                    <View style={{ backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                          className="flex flex-row rounded-full px-5 h-14 justify-center items-center">
                        <TouchableOpacity
                            className="w-full flex-1 flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray dark:text-tertiaryWhite">Announcements</Text>
                            <Switch
                                value={notifications.announcements}
                                onValueChange={()=>toggleNotification("announcements")}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                />
                        </TouchableOpacity>
                    </View>
                    <Text
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  dark:text-tertiaryGray"
                    >Receive updates on offers, promotions, and important announcements.
                    </Text>
                </View>

                <View className="w-full mb-6 px-5">
                    <Text className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack dark:text-general">Reset Notifications</Text>
                    <View style={{backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                          className="flex h-14 px-5 rounded-full justify-center items-center">
                        <TouchableOpacity
                                          onPress={handleResetNotification}
                                          className="w-full flex-1 flex flex-row justify-between items-center">
                            <Text style={{color: "#ff0000"}} className="font-GoogleSansMedium ">Reset all notifications</Text>
                            <Ionicons name="trash-bin-outline" size={18} color="#ff0000"/>
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{ color: "#ff0000"}}
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular"
                    >Reset all notification settings to default values.</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Notifications
