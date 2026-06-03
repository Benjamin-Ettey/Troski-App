import {View, Text, ScrollView, TouchableOpacity, Alert, Switch} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useAppStore} from "@/utils/store";

const Notifications = () => {

    const drivernotifications = useAppStore((state) => state.drivernotifications);
    const toggleDriverNotification = useAppStore((state) => state.toggleDriverNotification);
    const resetDriverNotifications = useAppStore((state)=> state.resetDriverNotifications);


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
                    onPress: ()=>resetDriverNotifications()
                }


            ]
        )
    }
    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">
            <ScrollView>
                <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Ride Notifications</Text>
                    <View
                        style={{backgroundColor: "#ffffff"}}
                        className="flex justify-center items-center h-14 rounded-full px-5">
                        <TouchableOpacity
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray ">Ride Update Notifications</Text>
                            <Switch
                                value={drivernotifications.driverRideUpdates}
                                onValueChange={()=>toggleDriverNotification("driverRideUpdates")}
                                trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                />

                        </TouchableOpacity>

                    </View>
                    <Text
                        className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  dark:text-tertiaryGray"
                    >Receive ride status updates and important trip notifications.</Text>
                </View>


                <View className="w-full mb-6 px-5">
                    <Text className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Payment Notifications</Text>
                    <View style={{backgroundColor: "#ffffff"}}
                          className="flex flex-row rounded-full px-5 justify-center h-14 items-center">
                        <TouchableOpacity
                            style={{ flex:1}}
                            className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray ">Payment Notifications</Text>
                            <Switch
                                value={drivernotifications.driverPaymentNotifications}
                                onValueChange={()=>toggleDriverNotification("driverPaymentNotifications")}
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
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Promotions & Announcements</Text>
                    <View style={{ backgroundColor: "#ffffff"}}
                          className="flex flex-row rounded-full px-5 h-14 justify-center items-center">
                        <TouchableOpacity
                            className="w-full flex-1 flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray ">Announcements</Text>
                            <Switch
                                value={drivernotifications.driverAnnouncements}
                                onValueChange={()=>toggleDriverNotification("driverAnnouncements")}
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
                    <Text className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Reset Notifications</Text>
                    <View style={{backgroundColor: "#ffffff"}}
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
