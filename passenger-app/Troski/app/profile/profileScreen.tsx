import {View, Text, Pressable, ScrollView} from 'react-native'
import React from 'react'
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import NavBar from "@/components/NavBar";
import LogoutNavBar from "@/components/LogoutNavBar";
import {useAppStore} from "@/utils/store";

const ProfileScreen = () => {
    const email = useAppStore((state)=>state.email);
    const name =  useAppStore((state)=> state.name)

    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">

                <StatusBar style='dark' />


                <ScrollView>
                    <View
                        style={{height: 84, paddingHorizontal: 16, marginTop: 24}}
                        className="w-full flex flex-row justify-start items-center gap-4 mb-8">

                        <Pressable
                            style={{padding: 10}}
                            className="flex justify-center items-center rounded-full bg-tertiaryGray">
                            <Ionicons name="person" color="gray" size={36}/>

                        </Pressable>

                        <View className="w-full justify-start flex flex-col">
                            <Text className="font-GoogleSansMedium">{name}</Text>
                            <Text className="text-sm font-GoogleSansRegular">{email}</Text>
                        </View>
                    </View>

                    <View
                        style={{paddingHorizontal: 16, gap: 24}}
                        className="w-full flex-1 ">

                        <View
                            style={{borderRadius: 24}}
                            className="w-full bg-general">
                            <NavBar name="camera-outline" textcolor="#007BFF" color="#007BFF" title="Change Profile Photo" goforwardcolor="#007BFF"/>
                        </View>

                        <View
                            style={{borderRadius: 24}}
                            className="w-full bg-general">
                            <NavBar name="person" textcolor="#444444" color="black" goforwardcolor="gray" title="Edit Profile"/>
                        </View>

                        <View
                            style={{borderRadius: 24}}
                            className="w-full bg-general">
                            <NavBar name="time" title="Ride History" textcolor="#444444" color="black" goforwardcolor="gray"/>
                            <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                            <NavBar name="card" title="Payment Methods" textcolor="#444444" color="black" goforwardcolor="gray"/>
                            <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                            <NavBar name="wallet" title="My Wallet" textcolor="#444444" color="black" goforwardcolor="gray"/>

                        </View>

                        <View
                            style={{borderRadius: 24}}
                            className="w-full bg-general">
                            <NavBar name="settings" title="Settings" textcolor="#444444" color="black" goforwardcolor="gray"/>
                            <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                            <NavBar name="information-circle" title="Information" textcolor="#444444" color="black" goforwardcolor="gray"/>

                        </View>

                        <View
                            style={{borderRadius: 24}}
                            className="w-full bg-general">
                            <NavBar name="mail-unread" textcolor="#444444" color="black" title="Recent emails" goforwardcolor="gray"/>
                        </View>

                        <View
                            style={{borderRadius: 24}}
                            className="w-full bg-general">
                            <LogoutNavBar name="log-out" title="Logout" textcolor="red" color="red"/>
                        </View>
                    </View>

                </ScrollView>
        </View>
    )
}
export default ProfileScreen
