import {View, Text} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import PrimaryButton from "@/components/PrimaryButton";
import {router} from "expo-router";

const ChangeNumberInfo = () => {
    return (
        <View style={{backgroundColor: "#F5F7FA", flex: 1}}>

            <View style={{height: "30%"}} className="w-full flex flex-row justify-center items-center">
                <Ionicons name="phone-portrait" size={72}/>
                <Ionicons name="swap-horizontal-outline" size={32}/>
                <Ionicons name="phone-portrait" size={72} color="#ffcc00"/>
            </View>

            <View style={{paddingLeft: 24, paddingRight: 24 }} className="w-full flex-1 flex flex-col ">
                <Text style={{marginBottom: 16}} className="font-GoogleSansRegular text-center flex-shrink">Use Change Phone number to migrate your account info and settings from your current phone number to a new phone number. You can&apos;t undo this change.</Text>
                <Text className="font-GoogleSansRegular text-center flex-shrink">To proceed, confirm that your new phone number can receive SMS or calls and tap Next to verify that number.</Text>

            </View>

            <View style={{bottom: 0, height: 100}} className="absolute w-full flex justify-center items-center">
                <PrimaryButton name="Next" disabled={false} onPress={()=>router.replace("/profile/changePhoneNumber")}/>
            </View>

        </View>
    )
}
export default ChangeNumberInfo
