import {Image, ScrollView, Text, View} from 'react-native'
import React from 'react'
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import NavBar from "@/components/NavBar";
import LogoutNavBar from "@/components/LogoutNavBar";
import {useAppStore} from "@/utils/store";
import {router} from "expo-router";
import * as ImagePicker from 'expo-image-picker'
import {useColorScheme} from "nativewind";


const Index = () => {
    const email = useAppStore((state)=>state.email);
    const name =  useAppStore((state)=> state.name)
    const image = useAppStore((state) => state.image);
    const setImage = useAppStore((state) => state.setImage);
    const { colorScheme } = useColorScheme();

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
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="flex-1">

                <StatusBar style='auto' />


                <ScrollView contentContainerStyle={{paddingBottom: 40}}>
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
                            <Text className="font-GoogleSansMedium text-secondaryBlack dark:text-general">{name}</Text>
                            <Text className="text-sm font-GoogleSansRegular text-secondaryBlack dark:text-tertiaryWhite">{email}</Text>
                        </View>
                    </View>

                    <View
                        style={{paddingHorizontal: 16, gap: 24}}
                        className="w-full flex-1 ">

                        <View
                            style={{borderRadius: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                            className="w-full ">
                            <NavBar onPress={handleImagePicker} name="camera-outline" textcolor="#007BFF" color="#007BFF" title="Change profile photo" goforwardcolor="#007BFF"/>
                        </View>

                        <View
                            style={{borderRadius: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                            className="w-full ">
                            <NavBar onPress={()=> router.push("/profile/editProfile")} name="person" textcolor={colorScheme === "dark"? "#f0f0f0" : "#444444"} color={colorScheme === "dark"? "#f0f0f0" : "#444444"} goforwardcolor={colorScheme === "dark"? "#f0f0f0" : "gray"} title="Edit profile"/>
                        </View>

                        <View
                            style={{borderRadius: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                            className="w-full ">
                            <NavBar onPress={()=>router.push("/profile/rideHistory")} name="bus" title="Ride history" textcolor={colorScheme === "dark"? "#f0f0f0" : "#444444"} color={colorScheme === "dark"? "#f0f0f0" : "#444444"} goforwardcolor={colorScheme === "dark"? "#f0f0f0" : "gray"}/>
                            <View style={{width: "100%", height: 1, backgroundColor: colorScheme === "dark"? "#e4e4e411" : "#e4e4e477"}} />
                            <NavBar onPress={()=> router.push("/profile/paymentMethod")} name="card" title="Payment methods" textcolor={colorScheme === "dark"? "#f0f0f0" : "#444444"} color={colorScheme === "dark"? "#f0f0f0" : "#444444"} goforwardcolor={colorScheme === "dark"? "#f0f0f0" : "gray"}/>
                            <View style={{width: "100%", height: 1, backgroundColor: colorScheme === "dark"? "#e4e4e411" : "#e4e4e477"}} />
                            <NavBar onPress={()=>router.push("/profile/myWallet")} name="wallet" title="My wallet" textcolor={colorScheme === "dark"? "#f0f0f0" : "#444444"} color={colorScheme === "dark"? "#f0f0f0" : "#444444"} goforwardcolor={colorScheme === "dark"? "#f0f0f0" : "gray"}/>

                        </View>

                        <View
                            style={{borderRadius: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                            className="w-full ">
                            <NavBar onPress={()=> router.push("/profile/settings")} name="settings" title="Settings" textcolor={colorScheme === "dark"? "#f0f0f0" : "#444444"} color={colorScheme === "dark"? "#f0f0f0" : "#444444"} goforwardcolor={colorScheme === "dark"? "#f0f0f0" : "gray"}/>
                            <View style={{width: "100%", height: 1, backgroundColor: colorScheme === "dark"? "#e4e4e411" : "#e4e4e477"}} />
                            <NavBar onPress={()=>router.push("/profile/information")} name="information-circle" title="Information" textcolor={colorScheme === "dark"? "#f0f0f0" : "#444444"} color={colorScheme === "dark"? "#f0f0f0" : "#444444"} goforwardcolor={colorScheme === "dark"? "#f0f0f0" : "gray"}/>

                        </View>

                        <View
                            style={{borderRadius: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                            className="w-full ">
                            <NavBar onPress={()=>router.push("/profile/recentEmails")} name="mail-unread" textcolor={colorScheme === "dark"? "#f0f0f0" : "#444444"} color={colorScheme === "dark"? "#f0f0f0" : "#444444"} title="Recent emails" goforwardcolor={colorScheme === "dark"? "#f0f0f0" : "gray"}/>
                        </View>

                        <View
                            style={{borderRadius: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                            className="w-full ">
                            <NavBar onPress={()=>router.push("/profile/requestRefund")} name="swap-horizontal" textcolor={colorScheme === "dark"? "#f0f0f0" : "#444444"} color={colorScheme === "dark"? "#f0f0f0" : "#444444"} title="Request refund" goforwardcolor={colorScheme === "dark"? "#f0f0f0" : "gray"}/>
                        </View>

                        <View
                            style={{borderRadius: 24, backgroundColor: colorScheme === "dark"? "#0a0a0a":"#ffffff"}}
                            className="w-full ">
                            <LogoutNavBar name="log-out" title="Logout" textcolor="red" color="red"/>
                        </View>
                    </View>

                </ScrollView>
        </View>
    )
}
export default Index
