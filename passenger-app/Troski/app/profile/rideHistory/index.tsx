import {View, Text,TouchableOpacity, Alert, SectionList} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";

const Index = () => {
    const [showRideHistory, setShowRideHistory] = useState(false);

    const DATA = [
        {date: "Jan 2026",

            data:[
            {id: 1, pickup: "Kasoa", destination: "Madina", price: "GH₵10.50", date: "15 Jan", passengercount: 8},
            {id: 2, pickup: "Madina", destination: "Circle", price: "GH₵20.00", date: "4 May", passengercount: 2},
            {id: 3, pickup: "Circle", destination: "Kasoa", price: "GH₵30.55", date: "2 Apr", passengercount: 10},
            {id: 4, pickup: "Tema", destination: "Airport", price: "GH₵5.50", date: "10 Feb", passengercount: 20},
            {id: 5, pickup: "Madina", destination: "Circle", price: "GH₵20.00", date: "4 May", passengercount: 2},
            ]
        },

        {date: "Feb 2026",
            data:[
            {id: 6, pickup: "Circle", destination: "Kasoa", price: "GH₵30.55", date: "2 Apr", passengercount: 10},
            {id: 7, pickup: "Tema", destination: "Airport", price: "GH₵5.50", date: "10 Feb", passengercount: 20},
            {id: 8, pickup: "Madina", destination: "Circle", price: "GH₵20.00", date: "4 May", passengercount: 2},
            {id: 9, pickup: "Circle", destination: "Kasoa", price: "GH₵30.55", date: "2 Apr", passengercount: 10},
            {id: 10, pickup: "Tema", destination: "Airport", price: "GH₵5.50", date: "10 Feb", passengercount: 20},
            ]
        },

        {date: "Feb 2026",
            data:[
                {id: 11, pickup: "Circle", destination: "Kasoa", price: "GH₵30.55", date: "2 Apr", passengercount: 10},
                {id: 12, pickup: "Tema", destination: "Airport", price: "GH₵5.50", date: "10 Feb", passengercount: 20},
                {id: 13, pickup: "Madina", destination: "Circle", price: "GH₵20.00", date: "4 May", passengercount: 2},
                {id: 14, pickup: "Circle", destination: "Kasoa", price: "GH₵30.55", date: "2 Apr", passengercount: 10},
                {id: 15, pickup: "Tema", destination: "Airport", price: "GH₵5.50", date: "10 Feb", passengercount: 20},
            ]
        },

    ];

    const handleClearRideHistory = ()=>{
        Alert.alert(
            "Delete Ride History?", "You are about to permanently delete all your ride history. This action cannot be reversed.",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: ()=>setShowRideHistory(true)

                    }


                    ]
        )

    }



    return (


        <View style={{backgroundColor: "#F5F7FA", flex: 1}} className="w-full">

            {showRideHistory?
                <View style={{flex: 1, marginTop: "-20%"}} className="w-full flex justify-center items-center">
                    <Ionicons style={{marginBottom: 10}} name="timer-outline" size={100} color="gray"/>
                    <Text className="font-GoogleSansMedium">No Ride History.</Text>
                    <Text style={{marginBottom: 16}} className="font-GoogleSansRegular text-center flex-shrink">Your ride history will appear here once you book a ride.</Text>

                    <TouchableOpacity onPress={()=>router.push("/homepage/bookings")} style={{paddingHorizontal: 12, paddingVertical: 12}} className="bg-primary rounded-full flex justify-center items-center">
                        <Text className="font-GoogleSansMedium">Book a ride</Text>
                    </TouchableOpacity>
                </View>
                :
                <View style={{paddingLeft: 16}} className="w-full flex items-center">
                    <View style={{borderRadius: 32, marginTop: 4}} >
                    <SectionList
                        sections={DATA}
                        keyExtractor={(item)=>item.id.toString()}

                        renderSectionHeader={({section})=>{
                            return(
                                <View style={{paddingHorizontal: 16, marginTop: 24}}>
                                    <Text className="font-GoogleSansMedium text-xl">{section.date}</Text>
                                </View>
                            )
                        }}

                        renderItem={({item})=>{
                            return(

                            <>
                                <View
                                    style={{height: 72, borderRadius: 24, paddingLeft: 20, paddingRight: 20,}}
                                    className="w-full  flex flex-row justify-between items-center">
                                    <View>
                                        <Ionicons name="location" size={32} color="black"/>

                                    </View>


                                    <View
                                        style={{flex: 1, gap: 2, paddingLeft: 16 }}
                                        className="flex  flex-col justify-center items-center ">
                                        <View className="flex flex-row justify-start items-center w-full gap-2">
                                            <Text className="text-xl font-GoogleSansRegular">
                                                {item.pickup}
                                            </Text>

                                            <Ionicons name="arrow-forward" size={12} color="black"/>

                                            <Text className="text-xl font-GoogleSansRegular">
                                                {item.destination}
                                            </Text>
                                        </View>

                                        <View className="w-full flex flex-row gap-2 items-center ">
                                            <Text
                                                style={{paddingHorizontal: 4, fontSize: 12}}
                                                className=" text-secondaryBlack font-GoogleSansRegular rounded-full">{item.date}</Text>


                                        </View>
                                    </View>

                                    <View
                                        style={{width: 84, height: 32, paddingHorizontal: 2}}
                                        className="rounded-full bg-primary flex justify-center items-center">
                                        <Text numberOfLines={1} className="font-GoogleSansBold text-sm">{item.price}</Text>
                                    </View>

                                </View>

                                <View className="w-full flex justify-end items-end">
                                    <View style={{height: 1, backgroundColor: "#44444422"}} className="w-[80%] "/>
                                </View>


                            </>
                        )
                        }}/>
                    </View>

                    <View style={{ bottom: 0, height: "15%"}} className="absolute w-full flex justify-center items-center">
                        <TouchableOpacity onPress={handleClearRideHistory}
                              style={{paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#ff0000"}}
                              className=" rounded-full shadow-2xl shadow-white flex justify-center items-center">
                            <Text style={{color: "white"}} className="font-GoogleSansMedium">Clear Ride History</Text>
                        </TouchableOpacity>
                    </View>

                </View>

            }

        </View>
    )
}
export default Index
