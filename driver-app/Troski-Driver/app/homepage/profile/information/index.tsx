import {View, Text, ScrollView, TouchableOpacity} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";

const Index = () => {

    const router = useRouter();

    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">
            <ScrollView contentContainerStyle={{paddingBottom: 100}}>
                <View  className="w-full mb-14 flex justify-center items-center">
                    <Ionicons name="information-circle" size={150} color="#ffcc00"/>
                </View>

                <View className="w-full px-6 mb-2 flex flex-col justify-start">
                    <Text  className="font-GoogleSansMedium text-base leading-6 text-secondaryBlack">Information</Text>
                    <Text  className="font-GoogleSansRegular text-sm leading-4 text-secondaryBlack">Learn more about Troski and how it works.</Text>
                </View>

                <View className="w-full px-5  flex flex-col justify-center items-center">
                    <View
                          className="w-full p-5">
                        <Text className="font-GoogleSansRegular text-base leading-5 mb-3 flex-shrink text-secondaryBlack">
                            Troski Driver is a mobile ride hailing app that helps drivers to quickly accept ride requests and safely commute passenger to their destination.
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink text-secondaryBlack">
                            Drivers get paid instantly when ride ends.
                        </Text>
                    </View>
                </View>

                <View className="w-full px-6 mt-5 flex flex-col justify-start">
                    <Text  className="font-GoogleSansMedium text-base leading-6 text-secondaryBlack">How Troski Driver Works</Text>
                </View>

                    <View
                      className="w-full p-5 mb-8 flex flex-col justify-center items-center">
                    <View
                          className="w-full px-5">
                        <Text  className="font-GoogleSansRegular text-base leading-5 flex-shrink text-secondaryBlack">
                            1. Passenger books a ride
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink text-secondaryBlack">
                            2. Driver accepts ride request
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink text-secondaryBlack">
                            3. Driver picks up passenger(s)
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink text-secondaryBlack">
                            4. Ride start automatically
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink text-secondaryBlack">
                            5. Payment released to driver upon successful pickup and drop of passenger
                        </Text>
                        <Text className="font-GoogleSansRegular text-base leading-5 flex-shrink text-secondaryBlack">
                            6. Note that driver uses booking codes to verify passengers and payments
                        </Text>
                    </View>
                </View>

                <View
                    className="w-full px-5 mb-3 flex flex-col justify-center items-center">
                    <View
                        style={{ backgroundColor: "#a9a9a922"}}
                        className="w-full px-5 py-4 rounded-3xl">
                        <TouchableOpacity
                            onPress={()=> router.push("/homepage/profile/information/helpCenter")}
                            className="w-full mb-3 flex flex-col justify-between">
                            <View className="w-full flex flex-row justify-between items-center">
                                <Text className="font-GoogleSansMedium text-base leading-5 text-secondaryBlack">Help Center</Text>
                                <Ionicons name="chevron-forward" size={16} color="gray"/>
                            </View>

                            <Text className="text-xs leading-4 font-GoogleSansRegular text-secondaryBlack">Get Help, Call us.</Text>

                        </TouchableOpacity>

                        <View style={{height: 1, backgroundColor: "#a9a9a9",}} className="w-full mb-3"/>

                        <TouchableOpacity
                            onPress={()=> router.push("/homepage/profile/information/sendFeedback")}
                            className="w-full flex flex-col justify-between">
                            <View className="w-full flex flex-row justify-between items-center">
                                <Text className="font-GoogleSansMedium text-base leading-4 text-secondaryBlack">Send Feedback</Text>
                                <Ionicons name="chevron-forward" size={16} color="gray"/>
                            </View>

                            <Text className="text-xs leading-4 font-GoogleSansRegular text-secondaryBlack">Report technical issues.</Text>

                        </TouchableOpacity>
                    </View>
                </View>

                <View  className="w-full px-12  flex flex-col justify-start ">
                    <Text className="font-GoogleSansMedium  text-secondaryBlack">Troski&copy;</Text>
                </View>
            </ScrollView>
        </View>
    )
}
export default Index
