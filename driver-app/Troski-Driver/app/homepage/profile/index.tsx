import {Image, ScrollView, Switch, Text, TouchableOpacity, View} from 'react-native'
import React from 'react'
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import NavBar from "@/components/NavBar";
import LogoutNavBar from "@/components/LogoutNavBar";
import {useAppStore} from "@/utils/store";
import {useRouter} from "expo-router";
import * as ImagePicker from 'expo-image-picker'



const Index = () => {
    const driveremail = useAppStore((state)=>state.driveremail);
    const driverfullname =  useAppStore((state)=> state.driverfullname)
    const driverimage = useAppStore((state) => state.driverimage);
    const setDriverImage = useAppStore((state) => state.setDriverImage);
    const toggleDriverOnline = useAppStore((state) => state.toggleDriverOnline);
    const isOnline = useAppStore((state)=> state.isOnline);

    const router = useRouter();

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
            setDriverImage(result.assets[0].uri)
        }
    }

    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">

            <StatusBar style='dark' />


            <ScrollView contentContainerStyle={{paddingBottom: 40}}>
                <View
                    className="w-full h-24 px-4 mt-6 flex flex-row justify-between items-center mb-4">

                    <View className="flex flex-row justify-start items-center px-2 gap-4 flex-1">
                        {driverimage ? (
                            <Image
                                source={{ uri: driverimage }}
                                className="h-16 w-16 bg-primary/30 flex justify-center items-center rounded-full border-2 border-primary"
                                resizeMode="cover"
                            />

                        ) : (
                            <View
                                className="flex justify-center h-16 w-16 p-2.5 bg-primary/30 items-center rounded-full border-2 border-primary"
                            >
                                <Ionicons name="person" color="#ffcc00" size={32} />
                            </View>
                        )}


                        <View className="w-full justify-start flex flex-col">
                            <Text className="font-GoogleSansMedium text-base leading-5 text-secondaryBlack dark:text-general">{driverfullname}</Text>
                            <Text className="text-sm leading-4 font-GoogleSansRegular text-secondaryBlack dark:text-tertiaryWhite">{driveremail}</Text>
                        </View>
                    </View>

                    <View style={{marginRight: 12}}>
                        <Ionicons name="shield-checkmark" size={20} color="#22C55E"/>
                    </View>
                </View>

                {!driverimage?
                    <View className="w-full  justify-center items-center px-4 mb-6">
                        <View className="bg-general px-4 py-3 flex-col w-full rounded-3xl">

                            <View className="flex flex-row gap-4 justify-start mb-4">
                                <Ionicons name="warning" size={32} color="#ff0000"/>

                                <View className="flex flex-col gap-2 flex-1">

                                    <Text className="text-base leading-none flex-shrink text-secondaryGray font-GoogleSansMedium">
                                        Please upload a profile photo
                                    </Text>

                                    <Text className="text-sm leading-none flex-shrink text-secondaryGray font-GoogleSansRegular">
                                        Passengers are more likely to trust and choose drivers whose identity can be clearly verified through a profile picture.
                                    </Text>
                                </View>
                            </View>


                            <TouchableOpacity onPress={handleImagePicker} style={{backgroundColor: "#22C55E"}} className="px-4 py-2 rounded-full justify-center items-center">
                                <Text style={{color: "#BBF7D0"}} className="font-GoogleSansMedium  text-base">Upload Profile Photo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    : null
                }


                <View
                    className="w-full flex-1 px-4 gap-6">

                    <View
                        style={{ backgroundColor: "#ffffff"}}
                        className="w-full rounded-full">
                        <TouchableOpacity
                            className="flex-row items-center justify-between w-full h-14 px-4"
                        >
                            <View className="flex-row items-center gap-4">
                                <Ionicons name="power" size={18} color="black" />
                                <Text className="text-base font-GoogleSansMedium">
                                    Go online
                                </Text>
                            </View>

                            <View className="justify-center items-center ">
                                <Switch
                                    value={isOnline.online}
                                    onValueChange={()=>toggleDriverOnline("online")}
                                    trackColor={{ false: "#d1d5db", true: "#22C55E"}}
                                />
                            </View>
                        </TouchableOpacity>

                    </View>



                    <View
                        style={{backgroundColor: "#ffffff"}}
                        className="w-full rounded-full">
                        <NavBar onPress={()=> router.push("/homepage/profile/editProfile")} name="person" textcolor="#444444" color="#444444" goforwardcolor="gray" title="Edit profile"/>
                    </View>

                    <View
                        style={{backgroundColor: "#ffffff"}}
                        className="w-full rounded-3xl">
                        <NavBar onPress={()=>router.push("/homepage/profile/rideHistory")} name="bus" title="Ride history" textcolor="#444444" color="#444444" goforwardcolor="gray"/>
                        <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                        <NavBar onPress={()=>router.push("/homepage/profile/myWallet")} name="wallet" title="My wallet" textcolor="#444444" color="#444444" goforwardcolor="gray"/>

                    </View>

                    <View
                        style={{ backgroundColor: "#ffffff"}}
                        className="w-full rounded-3xl">
                        <NavBar onPress={()=> router.push("/homepage/profile/settings")} name="settings" title="Settings" textcolor="#444444" color="#444444" goforwardcolor="gray"/>
                        <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                        <NavBar onPress={()=>router.push("/homepage/profile/information")} name="information-circle" title="Information" textcolor="#444444" color="#444444" goforwardcolor="gray"/>

                    </View>

                    <View
                        style={{backgroundColor: "#ffffff"}}
                        className="w-full rounded-full">
                        <NavBar onPress={()=>router.push("/homepage/profile/recentEmails")} name="mail-unread" textcolor="#444444" color="#444444" title="Recent emails" goforwardcolor="gray"/>
                    </View>

                    <View className="w-full  justify-center items-center ">
                        <View className="px-4 py-3 bg-secondaryBlack flex-col w-full rounded-3xl">

                            <View className="flex flex-row gap-4 justify-start mb-4">
                                <Ionicons name="bus" size={32} color="white"/>

                                <View className="flex flex-col gap-2 flex-1">

                                    <Text style={{}} className="text-base leading-none text-yellow-100 flex-shrink font-GoogleSansMedium">
                                        Register a New Vehicle
                                    </Text>

                                    <Text className="text-sm leading-none flex-shrink text-tertiaryWhite font-GoogleSansRegular">
                                        If you&apos;ve recently changed vehicles, submit your new vehicle information for verification. Once approved, you&apos;ll be able to use it for trips.
                                    </Text>
                                </View>
                            </View>


                            <TouchableOpacity onPress={()=>router.push("/")} className="px-4 py-2 bg-general rounded-full justify-center items-center">
                                <Text className="font-GoogleSansMedium text-secondaryBlack  text-base">Register New Vehicle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View
                        style={{ backgroundColor: "#ffffff"}}
                        className="w-full rounded-full">
                        <LogoutNavBar name="log-out" title="Logout" textcolor="red" color="red"/>
                    </View>



                </View>


            </ScrollView>
        </View>
    )
}
export default Index
