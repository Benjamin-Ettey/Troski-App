import {View, Text, Image, TouchableOpacity} from 'react-native'
import React from 'react'
import {StatusBar} from "expo-status-bar";
import PrimaryButton from "@/components/PrimaryButton";
import {router} from "expo-router";
import SecondaryButton from "@/components/SecondaryButton";


const LandingPage = () => {
    return (
        <View className="flex-1 bg-general relative">
            <StatusBar style="light"/>

            <Image
                style={{width: "100%", height: "70%", marginTop: -30}}
                source={require("../../assets/images/landingImage.png")}
                resizeMode="cover"
            />

            <View
                style={{borderTopLeftRadius: 48, borderTopRightRadius: 48}}
                className="w-full h-[50%] absolute bottom-0 flex items-center bg-general py-4 ">

                <View className=" w-full flex flex-col items-center mb-6">

                    <View className="w-16 h-16 rounded-full p-2 mb-2">
                        <Image style={{width: "100%", height: "100%"}} source={require("../../assets/images/favicon.png")} resizeMode="cover"/>
                    </View>
                    <Text className="text-secondaryBlack text-4xl font-medium text-center tracking-tighter leading-tighter max-w-[60%]">Book your rides on the go.</Text>

                </View>

                <View className="w-full flex items-center gap-2 mb-4">

                    <PrimaryButton  name="Sign up for free" onPress={()=>router.push("../onboarding/signup/emailScreen")}/>
                    <SecondaryButton name="Continue with Google" onPress={()=>router.push("/")}/>
                    <SecondaryButton name="Continue Apple" onPress={()=>router.push("/")}/>

                </View>

                <View className= "w-full flex items-center">
                    <TouchableOpacity onPress={()=>router.push("../../onboarding")} className="p-4 rounded-2xl flex justify-center items-center">
                        <Text className="text-xl font-medium text-secondaryGray">Login</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </View>
    )
}
export default LandingPage
