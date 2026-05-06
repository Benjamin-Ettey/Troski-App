import {Image, ScrollView, Text, View} from 'react-native'
import React from 'react'
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import NavBar from "@/components/NavBar";
import LogoutNavBar from "@/components/LogoutNavBar";
import {useAppStore} from "@/utils/store";
import {router} from "expo-router";
import * as ImagePicker from 'expo-image-picker'


const ProfileScreen = () => {
    const email = useAppStore((state)=>state.email);
    const name =  useAppStore((state)=> state.name)
    const image = useAppStore((state) => state.image);
    const setImage = useAppStore((state) => state.setImage);

    const handleImagePicker = async () => {

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted){
            alert("Permission to access gallery is required!")
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 1,
            allowsEditing: true,
        });
        if (!result.canceled){
            setImage(result.assets[0].uri)
        }
    }

    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">

                <StatusBar style='dark' />


                <ScrollView>
                    <View
                        style={{height: 84, paddingHorizontal: 16, marginTop: 24}}
                        className="w-full flex flex-row justify-start items-center gap-4 mb-8">

                        {image ? (
                            <Image
                                source={{ uri: image }}
                                style={{ width: 60, height: 60, backgroundColor: "#ffcc0033"  }}
                                className="flex justify-center items-center rounded-full border-2 border-primary"
                                resizeMode="cover"
                            />

                        ) : (
                            <View
                                style={{width: 60, height: 60, padding: 10, backgroundColor: "#ffcc0033" }}
                                className="flex justify-center items-center rounded-full border-2 border-primary"
                            >
                                <Ionicons name="person" color="#ffcc00" size={36} />
                            </View>
                        )}


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
                            <NavBar onPress={handleImagePicker} name="camera-outline" textcolor="#007BFF" color="#007BFF" title="Change Profile Photo" goforwardcolor="#007BFF"/>
                        </View>

                        <View
                            style={{borderRadius: 24}}
                            className="w-full bg-general">
                            <NavBar onPress={()=> router.push("/profile/editProfile")} name="person" textcolor="#444444" color="black" goforwardcolor="gray" title="Edit Profile"/>
                        </View>

                        <View
                            style={{borderRadius: 24}}
                            className="w-full bg-general">
                            <NavBar onPress={()=>router.push("/profile/rideHistory")} name="time" title="Ride History" textcolor="#444444" color="black" goforwardcolor="gray"/>
                            <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                            <NavBar onPress={()=> router.push("/profile/paymentMethod")} name="card" title="Payment Methods" textcolor="#444444" color="black" goforwardcolor="gray"/>
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
