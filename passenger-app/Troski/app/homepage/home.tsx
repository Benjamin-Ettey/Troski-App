import {View, Text} from 'react-native'
import React from 'react'
import {StatusBar} from "expo-status-bar";

const Home = () => {
    return (
        <View className="flex flex-1 justify-center items-center">
            <StatusBar style="dark"/>
            <Text className="text-3xl">Home. We go again tomorrow.</Text>
        </View>
    )
}
export default Home
