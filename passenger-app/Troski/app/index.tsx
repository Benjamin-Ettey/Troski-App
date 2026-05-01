import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import "../global.css"
import {router} from "expo-router";

const Index = () => {

    return (
        <View className="w-full flex items-center ">
            <Text className="font-DMSansBlack text-2xl tracking-tighter text-center mb-2">Click on the Go to see what shows next. </Text>
            <TouchableOpacity
                className="px-4 bg-blue-500 rounded-full w-[30%] h-12 flex justify-center items-center"
                onPress={()=> router.push("../onboarding/landingPage")}>
                <Text className="text-xl font-bold text-white">Go</Text>
            </TouchableOpacity>
        </View>
    )
}
export default Index
