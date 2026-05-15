import {View, Text, ScrollView, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const Index = () => {

    const { colorScheme } = useColorScheme();

    return (
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="flex-1">
            <ScrollView contentContainerStyle={{paddingBottom: 100}}>
                <View style={{height: "30%"}}  className="w-full flex justify-center items-center">
                    <Ionicons name="information-circle" size={150} color="#ffcc00"/>
                </View>

                <View style={{paddingHorizontal: 24, marginBottom: 16}} className="w-full flex flex-col justify-start">
                    <Text  className="font-GoogleSansMedium dark:text-general">Information</Text>
                    <Text  className="font-GoogleSansRegular dark:text-tertiaryWhite">Learn more about Troski and how it works.</Text>
                </View>

                <View style={{paddingHorizontal: 24, marginBottom: 24}} className="w-full flex flex-col justify-center items-center">
                    <View style={{borderRadius: 24, paddingVertical: 16, paddingHorizontal: 16}} className="w-full">
                        <Text style={{marginBottom: 10}} className="font-GoogleSansRegular flex-shrink dark:text-tertiaryGray">
                            Troski is a mobile ride hailing app that helps passengers book and verify tro-tro rides quickly and safely.
                        </Text>
                        <Text className="font-GoogleSansRegular flex-shrink dark:text-tertiaryGray">
                            Passengers can book rides, pay digitally, and verify their seat before boarding.
                        </Text>
                    </View>
                </View>

                <View style={{paddingHorizontal: 24, marginBottom: 10}} className="w-full flex flex-col justify-start">
                    <Text  className="font-GoogleSansMedium dark:text-general">How Troski Works</Text>
                </View>

                <View style={{paddingHorizontal: 24, marginBottom: 24}} className="w-full flex flex-col justify-center items-center">
                    <View style={{borderRadius: 24, paddingVertical: 16, paddingHorizontal: 16}} className="w-full">
                        <Text  className="font-GoogleSansRegular flex-shrink dark:text-tertiaryGray">
                            1. Passenger books a ride
                        </Text>
                        <Text className="font-GoogleSansRegular flex-shrink dark:text-tertiaryGray">
                            2. Payment secured
                        </Text>
                        <Text className="font-GoogleSansRegular flex-shrink dark:text-tertiaryGray">
                            3. Driver receives booking
                        </Text>
                        <Text className="font-GoogleSansRegular flex-shrink dark:text-tertiaryGray">
                            4. Passenger verifies with code when boarding
                        </Text>
                        <Text className="font-GoogleSansRegular flex-shrink dark:text-tertiaryGray">
                            5. Ride completes
                        </Text>
                        <Text className="font-GoogleSansRegular flex-shrink dark:text-tertiaryGray">
                            6. Driver receives payment
                        </Text>
                    </View>
                </View>

                <View style={{paddingHorizontal: 24, marginBottom: 8}} className="w-full flex flex-col justify-center items-center">
                    <View style={{borderRadius: 24, backgroundColor: "#a9a9a922", paddingVertical: 16, paddingHorizontal: 16}} className="w-full">
                        <TouchableOpacity style={{marginBottom: 10}} className="w-full flex flex-colw justify-between">
                            <View className="w-full flex flex-row justify-between">
                                <Text className="font-GoogleSansMedium dark:text-tertiaryWhite">Help Center</Text>
                                <Ionicons name="chevron-forward" size={16} color="gray"/>
                            </View>

                            <Text className="text-xs font-GoogleSansRegular dark:text-tertiaryGray">Get Help, Call us.</Text>

                        </TouchableOpacity>

                        <View style={{height: 1, backgroundColor: "#a9a9a9", marginBottom: 10}} className="w-full "/>

                        <TouchableOpacity className="w-full flex flex-colw justify-between">
                            <View className="w-full flex flex-row justify-between">
                                <Text className="font-GoogleSansMedium dark:text-tertiaryWhite">Send Feedback</Text>
                                <Ionicons name="chevron-forward" size={16} color="gray"/>
                            </View>

                            <Text className="text-xs font-GoogleSansRegular dark:text-tertiaryGray">Report technical issues.</Text>

                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{paddingHorizontal: 24, marginBottom: 24}} className="w-full flex flex-col justify-start ">
                    <Text className="font-GoogleSansMedium  dark:text-tertiaryGray">&copy;Troski</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Index
