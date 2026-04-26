import {View, Text} from 'react-native'
import React from 'react'
import "../global.css"
import {router} from "expo-router";
import MenuButton from "@/components/MenuButton";

const Index = () => {

    return (
        <View className="bg-white ">
            <Text className="font-ManropeBold text-xl tracking-tighter">Edit this index.js based on the UI!</Text>

            <View className="w-[48px] h-[48px]">

                <MenuButton onPress={()=>router.push("/")}  />
            </View>
        </View>
    )
}
export default Index
