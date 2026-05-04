import {View, Text, Image} from 'react-native'
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
                style={{width: "100%", height: "70%", }}
                source={require("../../assets/images/landingImage.png")}
                resizeMode="cover"
            />

            <View
                style={{borderTopLeftRadius: 36, borderTopRightRadius: 36}}
                className="w-full h-[40%] absolute bottom-0 flex items-center bg-general py-4 ">

                <View className=" w-full flex flex-col items-center mb-6">

                    <View className="w-16 h-16 rounded-full p-2 mb-2">
                        <Image style={{width: "100%", height: "100%"}} source={require("../../assets/images/favicon.png")} resizeMode="cover"/>
                    </View>
                    <Text className="text-secondaryBlack font-GoogleSansMedium text-4xl font-medium text-center tracking-tighter leading-tighter max-w-[60%]">Book your rides on the go.</Text>

                </View>

                <View className="w-full flex items-center gap-2 mb-4">

                    <PrimaryButton disabled={false}  name="Sign up for free" onPress={()=>router.push("../signup/emailScreen")}/>
                    <SecondaryButton title="Login" onPress={()=>router.push("../login/phoneNumberScreen")}/>

                </View>


            </View>

        </View>
    )
}
export default LandingPage
