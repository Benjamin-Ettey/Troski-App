import {View, Text} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import {router} from "expo-router";
import {useColorScheme} from "nativewind";

const Index = () => {
    const { colorScheme } = useColorScheme();


    return (
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="flex-1">

            <View className="w-full h-64 flex flex-row justify-center items-center">
                <Ionicons name="phone-portrait" size={72} color={colorScheme === "dark"? "#ffffff": "#000000"}/>
                <Ionicons name="swap-horizontal-outline" size={32} color={colorScheme === "dark"? "#ffffff": "#000000"}/>
                <Ionicons name="phone-portrait" size={72} color="#ffcc00"/>
            </View>

            <View className="w-full px-7 flex-1 flex flex-col ">
                <Text className="mb-5 font-GoogleSansRegular text-secondaryBlack dark:text-tertiaryWhite text-center flex-shrink">Use Change Phone number to migrate your account info and settings from your current phone number to a new phone number. You can&apos;t undo this change.</Text>
                <Text className="font-GoogleSansRegular text-secondaryBlack dark:text-tertiaryWhite text-center flex-shrink">To proceed, confirm that your new phone number can receive SMS or calls and tap Next to verify that number.</Text>

            </View>

            <View className="absolute bottom-0 h-28  w-full flex justify-center items-center">
                <PrimaryButton name="Next" disabled={false} onPress={()=>router.replace("/profile/editProfile/changePhoneNumber/changeOldPhoneNumber")}/>
            </View>

        </View>
    )
}
export default Index
