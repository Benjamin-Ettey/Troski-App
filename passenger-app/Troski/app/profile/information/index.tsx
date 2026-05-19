import {View, Text, ScrollView, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const Index = () => {

    const { colorScheme } = useColorScheme();

    return (
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="flex-1">
            <ScrollView contentContainerStyle={{paddingBottom: 100}}>
                <View  className="w-full mb-14 flex justify-center items-center">
                    <Ionicons name="information-circle" size={150} color="#ffcc00"/>
                </View>

                <View className="w-full px-6 mb-2 flex flex-col justify-start">
                    <Text  className="font-GoogleSansMedium text-base leading-6 dark:text-general">Information</Text>
                    <Text  className="font-GoogleSansRegular text-sm leading-4 dark:text-tertiaryWhite">Learn more about Troski and how it works.</Text>
                </View>

                <View className="w-full px-5  flex flex-col justify-center items-center">
                    <View
                          className="w-full p-5">
                        <Text className="font-GoogleSansRegular text-base leading-5 mb-3 flex-shrink dark:text-tertiaryGray">
                            Troski is a mobile ride hailing app that helps passengers book and verify tro-tro rides quickly and safely.
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink dark:text-tertiaryGray">
                            Passengers can book rides, pay digitally, and verify their seat before boarding.
                        </Text>
                    </View>
                </View>

                <View className="w-full px-6 mt-5 flex flex-col justify-start">
                    <Text  className="font-GoogleSansMedium text-base leading-6 dark:text-general">How Troski Works</Text>
                </View>

                    <View
                      className="w-full p-5 mb-8 flex flex-col justify-center items-center">
                    <View
                          className="w-full px-5">
                        <Text  className="font-GoogleSansRegular text-base leading-5 flex-shrink dark:text-tertiaryGray">
                            1. Passenger books a ride
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink dark:text-tertiaryGray">
                            2. Payment secured
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink dark:text-tertiaryGray">
                            3. Driver receives booking
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink dark:text-tertiaryGray">
                            4. Passenger verifies with code when boarding
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink dark:text-tertiaryGray">
                            5. Ride completes
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink dark:text-tertiaryGray">
                            6. Driver receives payment
                        </Text>
                    </View>
                </View>

                <View
                    className="w-full px-5 mb-3 flex flex-col justify-center items-center">
                    <View
                        style={{ backgroundColor: "#a9a9a922"}}
                        className="w-full px-5 py-4 rounded-3xl">
                        <TouchableOpacity
                            className="w-full mb-3 flex flex-col justify-between">
                            <View className="w-full flex flex-row justify-between items-center">
                                <Text className="font-GoogleSansMedium text-base leading-5 dark:text-tertiaryWhite">Help Center</Text>
                                <Ionicons name="chevron-forward" size={16} color="gray"/>
                            </View>

                            <Text className="text-xs leading-4 font-GoogleSansRegular dark:text-tertiaryGray">Get Help, Call us.</Text>

                        </TouchableOpacity>

                        <View style={{height: 1, backgroundColor: "#a9a9a9",}} className="w-full mb-3"/>

                        <TouchableOpacity className="w-full flex flex-col justify-between">
                            <View className="w-full flex flex-row justify-between items-center">
                                <Text className="font-GoogleSansMedium text-base leading-4dark:text-tertiaryWhite">Send Feedback</Text>
                                <Ionicons name="chevron-forward" size={16} color="gray"/>
                            </View>

                            <Text className="text-xs leading-4 font-GoogleSansRegular dark:text-tertiaryGray">Report technical issues.</Text>

                        </TouchableOpacity>
                    </View>
                </View>

                <View  className="w-full px-12  flex flex-col justify-start ">
                    <Text className="font-GoogleSansMedium  dark:text-tertiaryGray">Troski&copy;</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Index
