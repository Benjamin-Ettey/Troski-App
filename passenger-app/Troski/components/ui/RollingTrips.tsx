import {View, Text, FlatList, Pressable, Image} from 'react-native'
import React from 'react'
import {Ionicons} from "@expo/vector-icons";

const RollingTrips = () => {

    const data = [
        {id: 1, pickup: "Kasoa", destination: "Madina", price: "GH₵10.50", minutes: "12min", passengercount: 8},
        {id: 2, pickup: "Madina", destination: "Circle", price: "GH₵20.00", minutes: "4min", passengercount: 2},
        {id: 3, pickup: "Circle", destination: "Kasoa", price: "GH₵30.55", minutes: "2min", passengercount: 10},
        {id: 4, pickup: "Tema", destination: "Airport", price: "GH₵5.50", minutes: "10min", passengercount: 20},
    ]

    return (
        <FlatList
            numColumns={1}
            showsVerticalScrollIndicator={true}
            ListHeaderComponent= {
                <View
                    style={{marginTop: 6}}
                    className="w-full flex items-start justify-start mb-2">
                    <Text className="font-medium text-xl tracking-tighter">
                    Rolling Trips
                    </Text>
                </View>
            }
            data={data || []}
            keyExtractor={(item)=>item.id.toString()}
            renderItem={({item})=>{
                return (
                    <Pressable
                        style={{height: 72, borderRadius: 24, marginBottom: 12, paddingLeft: 20, paddingRight: 20, gap: 24}}
                        className="w-full bg-tertiaryWhite flex flex-row justify-between items-center">
                        <View>
                            <Image
                                source={require("../../assets/images/minibus.png")}
                                style={{width: 32, height: 32}}
                            />
                        </View>


                        <View
                            style={{width: "50%", gap: 2}}
                            className="flex flex-col justify-center items-center ">
                            <View className="flex flex-row justify-start items-center w-full gap-2">
                                <Text className="text-xl font-medium">
                                    {item.pickup}
                                </Text>

                                <Ionicons name="arrow-forward" size={24} />


                                <Text className="text-xl font-medium">
                                    {item.destination}
                                </Text>
                            </View>

                            <View className="w-full flex flex-row gap-2 items-center ">
                                <Text
                                    style={{paddingHorizontal: 4, paddingVertical: 1, fontSize: 10}}
                                    className=" text-white bg-tertiaryGray rounded-full">{item.minutes}</Text>

                                <View
                                    style={{gap: 2}}
                                    className="flex flex-row items-center ">
                                    <Ionicons name="person" size={10} color="gray"/>
                                    <Text style={{fontSize: 12}}>{item.passengercount}</Text>
                                </View>

                            </View>
                        </View>

                        <View
                            style={{width: 84, height: 32, paddingHorizontal: 2}}
                            className="rounded-full bg-primary flex justify-center items-center">
                            <Text numberOfLines={1} className="font-bold text-sm">{item.price}</Text>
                        </View>
                    </Pressable>
                )
            }}/>
    )
}
export default RollingTrips
