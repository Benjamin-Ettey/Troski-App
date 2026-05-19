import {View, Text,TouchableOpacity, Alert, SectionList} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useColorScheme} from "nativewind";

const Index = () => {
    const [showRideHistory, setShowRideHistory] = useState(false);
    const { colorScheme } = useColorScheme();


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


        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA"}} className="w-full flex-1">

            {showRideHistory?
                <View style={{ marginTop: "-20%"}} className="w-full flex-1 flex justify-center items-center">
                    <Ionicons className="mb-3" name="timer-outline" size={100} color="gray"/>
                    <Text className="font-GoogleSansMedium text-xl leading-6 tracking-tighter dark:text-general">No Ride History.</Text>
                    <Text className="font-GoogleSansRegular mb-4 text-sm leading-5 dark:text-tertiaryGray text-center flex-shrink">Your ride history will appear here once you book a ride.</Text>

                    <TouchableOpacity
                        onPress={()=>router.push("/homepage/bookings")}
                        className="bg-primary rounded-full px-4 h-12 flex justify-center items-center">
                        <Text className="font-GoogleSansMedium text-base leading-5">Book a ride</Text>
                    </TouchableOpacity>
                </View>
                :
                <View style={{paddingLeft: 16}} className="w-full flex items-center">
                    <View >
                    <SectionList
                        contentContainerStyle={{paddingBottom: 100}}
                        sections={DATA}
                        keyExtractor={(item)=>item.id.toString()}

                        renderSectionHeader={({section})=>{
                            return(
                                <View >
                                    <Text className="font-GoogleSansMedium px-4 text-xl leading-6 mt-6 dark:text-general">{section.date}</Text>
                                </View>
                            )
                        }}

                        renderItem={({item})=>{
                            return(

                            <>
                                <View
                                    className="w-full h-20 px-6 flex flex-row justify-between items-center">
                                    <View>
                                        <Ionicons name="location" size={32} color={colorScheme === "dark"? "#ffffff":"black"}/>

                                    </View>


                                    <View
                                        style={{paddingLeft: 16 }}
                                        className="flex flex-1 gap-2  flex-col justify-center items-center ">
                                        <View className="flex flex-row justify-start items-center w-full gap-2">
                                            <Text className="text-xl leading-6 font-GoogleSansRegular dark:text-general">
                                                {item.pickup}
                                            </Text>

                                            <Ionicons name="arrow-forward" size={12} color={colorScheme === "dark"? "#ffffff":"black"}/>

                                            <Text className="text-xl leading-6 font-GoogleSansRegular dark:text-general">
                                                {item.destination}
                                            </Text>
                                        </View>

                                        <View className="w-full flex flex-row gap-2 items-center ">
                                            <Text
                                                className=" text-secondaryBlack text-sm leading-4 font-GoogleSansRegular rounded-full dark:text-tertiaryGray">{item.date}</Text>


                                        </View>
                                    </View>

                                    <View
                                        className="rounded-full h-9 w-24 px-1 bg-primary dark:bg-secondaryBlack flex justify-center items-center">
                                        <Text numberOfLines={1} className="font-GoogleSansBold text-sm leading-4 dark:text-primary">{item.price}</Text>
                                    </View>

                                </View>

                                <View className="w-full flex justify-end items-end">
                                    <View style={{height: 1, backgroundColor: colorScheme === "dark"? "#44444455" : "#44444422"}} className="w-[80%] "/>
                                </View>


                            </>
                        )
                        }}/>
                    </View>

                    <View className="absolute bottom-12 w-full flex justify-center items-center">
                        <TouchableOpacity onPress={handleClearRideHistory}
                              style={{backgroundColor: "#ff0000"}}
                              className=" rounded-full px-4 h-12 flex justify-center items-center">
                            <Text className="font-GoogleSansMedium text-base leading-5 text-general">Clear Ride History</Text>
                        </TouchableOpacity>
                    </View>

                </View>

            }

        </View>
    )
}
export default Index
