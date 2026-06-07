import {View, Text, Pressable, TouchableOpacity, Modal, Image} from 'react-native'
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {StatusBar} from "expo-status-bar";
import MapView from "react-native-maps";
import BottomSheet, {BottomSheetView} from "@gorhom/bottom-sheet";
import EarningNavBar from "@/components/EarningNavBar";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";

const Index = () => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["35%", "50%", "100%"], []);
    const [showIndex, setShowIndex] = useState(0);
    const [showRideRequest, setShowRideRequest] = useState(true);


    useEffect(() => {
        const timer = setTimeout(()=>{
            setShowRideRequest(false);
        }, 3000)

        return ()=> clearTimeout(timer);
    }, []);

    const router = useRouter();


    return (
        <View className="flex-1 bg-general">
            <StatusBar style="light"/>

            <MapView style={{ width: "100%", height: "100%"}}/>


            <View
                className="w-full flex flex-row justify-between items-center"
                style={{
                    position: "absolute",
                    top: 60,

                }}
            >
                <TouchableOpacity
                    onPress={() => router.push("/homepage/profile")}
                    className="bg-white dark:bg-secondaryBlack"
                    style={{
                        padding: 10,
                        borderRadius: 20,
                        elevation: 5,
                        left: 20,
                    }}
                >
                    <Ionicons name="menu" size={24} color="#000000" />
                </TouchableOpacity>

                <Pressable
                    className="flex flex-row bg-white dark:bg-secondaryBlack justify-between items-center rounded-full"
                    style={{
                        padding: 10,
                        elevation: 5,
                        right: 20,
                        gap: 10
                    }}
                >
                    <TouchableOpacity onPress={()=>router.push("/homepage/profile/rideHistory")}>
                        <Ionicons name="bus-outline" size={22} color="#000000"/>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=>router.push("/homepage/profile/myWallet")}>
                        <Ionicons name="wallet" size={24} color="#000000"/>
                    </TouchableOpacity>

                </Pressable>
            </View>


            <BottomSheet
                ref={bottomSheetRef}
                index={showIndex}
                snapPoints={snapPoints}
                enablePanDownToClose={false}
                backgroundStyle={{
                    backgroundColor: "#ffffff",
                }}
                handleIndicatorStyle={{
                    backgroundColor: "gray",
                }}

            >
                <BottomSheetView>

                    {showRideRequest?
                        <View
                            className="flex flex-col gap-2 "
                            style={{ paddingHorizontal: 16, paddingVertical: 8, height: 300 }}>

                            <Text style={{paddingLeft: 12}} className="text-xl leading-6 tracking-tight text-secondaryBlack  font-GoogleSansMedium">Earnings</Text>

                            <EarningNavBar/>
                        </View>

                        :


                        <View style={{height: 300}} className="w-full flex flex-col   items-center gap-4 px-4">
                            <Text className="text-xl leading-6 tracking-tight mt-4 text-secondaryBlack  font-GoogleSansMedium">Incoming Ride Request</Text>

                            <Pressable

                                className="w-full h-20 rounded-3xl px-4 mb-4 gap-4 bg-tertiaryWhite dark:bg-secondaryGray/40 flex flex-col justify-center items-center"
                            >
                                <View className="flex w-full flex-row justify-between items-center gap-4">

                                    <View className="flex-row flex gap-4 flex-1">

                                        <Image
                                            source={require("../../assets/images/minibus.png")}
                                            className="w-9 h-9 mx-2"
                                        />


                                        <View className="flex flex-col">

                                            <View className="flex  flex-row justify-start items-center gap-2">
                                                <Text
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                    className="text-lg leading-5 font-GoogleSansRegular max-w-[80px] text-secondaryBlack dark:text-tertiaryGray"
                                                >
                                                    Kasoa
                                                </Text>

                                                <Ionicons name="arrow-forward" size={12} color="#444444" />

                                                <Text
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                    className="text-lg leading-5 font-GoogleSansRegular max-w-[80px] text-secondaryBlack dark:text-tertiaryGray"
                                                >
                                                    Accra
                                                </Text>
                                            </View>

                                            <View className="w-full flex flex-row items-center mt-1">
                                                <Text
                                                    className="text-white text-xs leading-4 px-2 py-0.5 bg-secondaryBlack font-GoogleSansRegular rounded-full"
                                                >
                                                    39min
                                                </Text>

                                                <View className="flex gap-1 flex-row items-center ml-2">
                                                    <Ionicons name="person" size={12} color="gray" />
                                                    <Text className="font-GoogleSansRegular text-sm leading-4 text-secondaryGray dark:text-tertiaryWhite">
                                                        6
                                                    </Text>
                                                </View>
                                            </View>

                                        </View>

                                    </View>


                                    <View
                                        className="rounded-full h-9 w-24 bg-primary dark:bg-secondaryBlack flex justify-center items-center"
                                    >
                                        <Text numberOfLines={1} className="font-GoogleSansBold text-sm leading-4 dark:text-primary text-secondaryBlack">
                                            GHC100
                                        </Text>

                                    </View>




                                </View>




                            </Pressable>

                            <View className="w-full justify-center items-center flex flex-col gap-3">
                                <PrimaryButton
                                    name="Accept"
                                    onPress={()=> router.push("/")}
                                    isDisabled="false"

                                />

                                <SecondaryButton
                                    title="Cancel"
                                    onPress={()=> setShowRideRequest(true)}
                                />
                            </View>
                        </View>

                    }






                </BottomSheetView>
            </BottomSheet>
        </View>
    )
}
export default Index
