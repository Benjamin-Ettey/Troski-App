import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import React, {useState} from 'react'
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import NavBar from "@/components/NavBar";
import LogoutNavBar from "@/components/LogoutNavBar";
import {useAppStore} from "@/utils/store";
import {useRouter} from "expo-router";
import * as ImagePicker from 'expo-image-picker'
import LottieView from "lottie-react-native";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import {AnimatedView} from "react-native-reanimated/src/component/View";
import {FadeInDown} from "react-native-reanimated";



const Index = () => {
    const driveremail = useAppStore((state)=>state.driveremail);
    const driverfullname =  useAppStore((state)=> state.driverfullname)
    const driverimage = useAppStore((state) => state.driverimage);
    const setDriverImage = useAppStore((state) => state.setDriverImage);
    const toggleDriverOnline = useAppStore((state) => state.toggleDriverOnline);
    const isOnline = useAppStore((state)=> state.isOnline);

    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);


    const router = useRouter();

    const handleImagePicker = async () => {
        try {
            setLoading(true);

            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                alert("Permission to access gallery is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 1,
                allowsEditing: true,
            });

            if (!result.canceled) {
                setDriverImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = ()=>{
        setShowModal(false);
        router.push("/homepage/profile/updateVehicle");
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
                            <Text className="font-GoogleSansMedium text-base leading-tight text-secondaryBlack ">{driverfullname}</Text>
                            <Text className="text-sm leading-tight font-GoogleSansRegular text-secondaryBlack ">{driveremail}</Text>
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

                                    <Text className="text-base leading-tight flex-shrink text-secondaryGray font-GoogleSansMedium">
                                        Please upload a Profile Photo
                                    </Text>

                                    <Text className="text-sm leading-tight flex-shrink text-secondaryGray font-GoogleSansRegular">
                                        Passengers are more likely to trust and choose drivers whose identity can be clearly verified through a profile picture.
                                    </Text>
                                </View>
                            </View>


                            {loading?
                                <TouchableOpacity style={{backgroundColor: "#22C55E"}} className="px-4 py-2 rounded-full justify-center items-center">
                                    <ActivityIndicator size="small" color="#ffffff"/>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={handleImagePicker} style={{backgroundColor: "#22C55E"}} className="px-4 py-2 rounded-full justify-center items-center">
                                    <Text style={{color: "#BBF7D0"}} className="font-GoogleSansMedium  text-base">Upload Profile Photo</Text>
                                </TouchableOpacity>
                            }

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
                                    Go Online
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
                        <NavBar onPress={()=> router.push("/homepage/profile/editProfile")} name="person" textcolor="#444444" color="#444444" goforwardcolor="gray" title="Edit Profile"/>
                    </View>

                    <View
                        style={{backgroundColor: "#ffffff"}}
                        className="w-full rounded-3xl">
                        <NavBar onPress={()=>router.push("/homepage/profile/rideHistory")} name="bus" title="Ride History" textcolor="#444444" color="#444444" goforwardcolor="gray"/>
                        <View style={{width: "100%", height: 1, backgroundColor: "#e4e4e477"}} />
                        <NavBar onPress={()=>router.push("/homepage/profile/myWallet")} name="wallet" title="My Wallet" textcolor="#444444" color="#444444" goforwardcolor="gray"/>

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
                        <NavBar onPress={()=>router.push("/homepage/profile/recentEmails")} name="mail-unread" textcolor="#444444" color="#444444" title="Recent Emails" goforwardcolor="gray"/>
                    </View>

                    <View className="w-full  justify-center items-center ">
                        <View className="px-4 py-3 bg-secondaryBlack flex-col w-full rounded-3xl">

                            <View className="flex flex-row gap-4 justify-start mb-4">
                                <Ionicons name="bus" size={32} color="white"/>

                                <View className="flex flex-col gap-2 flex-1">

                                    <Text style={{}} className="text-base leading-tight text-yellow-100 flex-shrink font-GoogleSansMedium">
                                        Register a New Vehicle
                                    </Text>

                                    <Text className="text-sm leading-tight flex-shrink text-tertiaryWhite font-GoogleSansRegular">
                                        If you&apos;ve recently changed vehicles, submit your new vehicle information for verification. Once approved, you&apos;ll be able to use it for trips.
                                    </Text>
                                </View>
                            </View>


                            <TouchableOpacity onPress={()=>setShowModal(true)} className="px-4 py-2 bg-general rounded-full justify-center items-center">
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

            <Modal
                transparent
                visible={showModal}
                animationType="fade"
                onRequestClose={()=>setShowModal(false)}
            >
                <Pressable
                    onPress={()=>setShowModal(false)}
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >

                    <AnimatedView
                        entering={FadeInDown.duration(300)}
                        className="w-full h-[480px] rounded-t-3xl bg-general items-center flex flex-col absolute bottom-0 px-4">

                        <View className="w-full top-4 items-end absolute">
                            <TouchableOpacity
                                onPress={()=>setShowModal(false)}
                                className="p-0.5 rounded-full bg-tertiaryGray/50">
                                <Ionicons name="close" size={24} color="black"/>
                            </TouchableOpacity>
                        </View>

                        <LottieView
                            source={require("../../../assets/video/newvehicle.json")}
                            autoPlay
                            loop
                            style={{width: 200, height: 200}}
                        />

                        <Text className="mb-5 font-GoogleSansRegular text-sm leading-tight text-secondaryBlack text-center flex-shrink">
                            Bought a <Text className="font-GoogleSansMedium">new vehicle</Text> or <Text className="font-GoogleSansMedium">updated</Text> your vehicle details?
                            Submit a vehicle update request. You&apos;ll be temporarily logged out while we verify the changes and can log back in once your vehicle is approved.
                        </Text>

                        <Text className="mb-5 font-GoogleSansRegular text-sm leading-tight text-secondaryBlack text-center flex-shrink">
                            Tap <Text className="font-GoogleSansMedium">Continue</Text> to proceed or <Text className="font-GoogleSansMedium">Contact support</Text> for assistance.
                        </Text>

                        <View className="w-full flex flex-col gap-3 justify-center bottom-10 absolute items-center">
                            <PrimaryButton
                                name="Continue"
                                onPress={handleContinue}
                                isDisabled={false}
                            />
                            <SecondaryButton
                                title="Call customer care"
                                onPress={()=>router.push("/")}

                            />
                        </View>


                    </AnimatedView>

                </Pressable>

            </Modal>
        </View>
    )
}
export default Index
