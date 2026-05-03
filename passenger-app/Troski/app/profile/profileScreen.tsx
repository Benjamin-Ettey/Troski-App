import {View, Text, Pressable, Image, ScrollView} from 'react-native'
import React from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import NavBar from "@/components/NavBar";
import LogoutNavBar from "@/components/LogoutNavBar";

const ProfileScreen = () => {
    return (
        <View className="flex-1">

            <SafeAreaView className="flex-1 w-full">
                <StatusBar style='dark' />

                <View className="px-4 w-full flex flex-row justify-start items-center mb-8">
                    <View className="flex justify-center items-start">
                        <Pressable
                            onPress={()=>router.back()}
                            className="rounded-full bg-general p-2 shadow-black shadow-2xl">
                            <Ionicons name="arrow-back" size={24} />
                        </Pressable>
                    </View>

                    <View
                        style={{width: "80%"}}
                        className="flex justify-center items-center ">
                        <Text className="text-xl font-medium">Profile</Text>
                    </View>

                </View>

                <ScrollView>
                    <View
                        style={{height: 84, paddingHorizontal: 16}}
                        className="w-full flex flex-row justify-start items-center gap-4 mb-8">

                        <View
                            style={{padding: 10}}
                            className="flex justify-center items-center rounded-full bg-tertiaryGray">
                            <Image
                                source={require("../../assets/images/minibus.png")}
                                resizeMode="cover"

                            />

                        </View>

                        <View className="w-full justify-start flex flex-col">
                            <Text className="font-medium">Tsumasi Ankrah</Text>
                            <Text className="text-sm">bizzarejacaranda@gmail.com</Text>
                        </View>
                    </View>

                    <View
                        style={{paddingHorizontal: 16}}
                        className="w-full flex-1 ">

                        <View
                            style={{borderRadius: 24, marginBottom: 24}}
                            className="w-full bg-general">
                            <NavBar name="person" title="Edit Profile"/>
                        </View>

                        <View
                            style={{borderRadius: 24, marginBottom: 24}}
                            className="w-full bg-general">
                            <NavBar name="time" title="Ride History"/>
                            <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                            <NavBar name="card" title="Payment Methods"/>
                            <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                            <NavBar name="wallet" title="My Wallet"/>

                        </View>

                        <View
                            style={{borderRadius: 24, marginBottom: 24}}
                            className="w-full bg-general">
                            <NavBar name="settings" title="Settings"/>
                            <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                            <NavBar name="information-circle" title="Information"/>

                        </View>

                        <View
                            style={{borderRadius: 24, marginBottom: 24}}
                            className="w-full bg-general">
                            <LogoutNavBar name="log-out" title="Logout"/>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    )
}
export default ProfileScreen
