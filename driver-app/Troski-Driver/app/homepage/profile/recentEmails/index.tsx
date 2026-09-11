import {View, Text,TouchableOpacity, Alert, SectionList} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";

const Index = () => {
    const [showRideHistory, setShowRideHistory] = useState(false);

    const DATA = [
        {date: "Jan 2026",

            data:[
                {id: 1, subject: "Book your faster trip to the beach",  verified: "verified", date: "15 Jan", },
                {id: 2, subject: "Troski just got it first ever",  verified: "verified", date: "4 May", },
                {id: 3, subject: "Hello, I'm Tsumasi...", verified: "verified", date: "2 Apr", },
                {id: 4, subject: "Let's redefine the bridge between the two",  verified: "verified", date: "10 Feb", },
                {id: 5, subject: "Book faster, Book safely",  verified: "verified", date: "4 May", },
            ]
        },

        {date: "Feb 2026",
            data:[
                {id: 6, subject: "Book your faster trip to the beach",  verified: "verified", date: "2 Apr", },
                {id: 7, subject: "Let's redefine the bridge between the two",  verified: "verified", date: "10 Feb", },
                {id: 8, subject: "Book faster, Book safely",  verified: "verified", date: "4 May", },
                {id: 9, subject: "Book your faster trip to the beach",  verified: "verified", date: "2 Apr", },
                {id: 10, subject: "Let's redefine the bridge between the two",  verified: "verified", date: "10 Feb",},
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


        <View style={{backgroundColor: "#F5F7FA"}} className="w-full flex-1">

            {showRideHistory?
                <View style={{ marginTop: "-20%"}} className="w-full flex-1 flex justify-center items-center">
                    <Ionicons className="mb-2" name="mail-unread-outline" size={100} color="gray"/>
                    <Text className="font-GoogleSansMedium text-xl leading-6 tracking-tighter text-secondaryBlack">No Recent Emails.</Text>
                    <Text className="font-GoogleSansRegular mb-3 text-sm leading-4 text-center flex-shrink text-secondaryBlack">All your recent emails will appear here.</Text>

                </View>
                :
                <View style={{paddingLeft: 16}} className="w-full flex items-center">
                    <View className="mt-2">
                        <SectionList
                            contentContainerStyle={{ paddingBottom: 100}}
                            sections={DATA}
                            keyExtractor={(item)=>item.id.toString()}

                            renderSectionHeader={({section})=>{
                                return(
                                    <View className="px-4 mt-6" >
                                        <Text className="font-GoogleSansMedium text-xl leading-6 text-secondaryBlack">{section.date}</Text>
                                    </View>
                                )
                            }}

                            renderItem={({item})=>{
                                return(

                                    <>
                                        <View
                                            className="w-full h-20 px-5  flex flex-row justify-between items-center">
                                            <View>
                                                <Ionicons name="mail-unread" size={32} color="black"/>

                                            </View>


                                            <View
                                                style={{paddingLeft: 16 }}
                                                className="flex flex-1  flex-col justify-center items-center ">
                                                <View className="flex flex-row justify-start items-center w-full gap-2">
                                                    <Text numberOfLines={1} className="text-xl leading-6 font-GoogleSansRegular text-secondaryBlack">
                                                        {item.subject}
                                                    </Text>

                                                </View>

                                                <View className="w-full flex flex-row gap-2 justify-start items-center ">
                                                    <Text
                                                        className=" text-secondaryBlack text-sm font-GoogleSansRegular rounded-full">{item.date}</Text>
                                                </View>
                                            </View>

                                            <View
                                                className="rounded-full px-4 flex justify-center items-center">
                                                <Ionicons name="ribbon" size={24} color="#22C55E"/>
                                            </View>

                                        </View>

                                        <View className="w-full flex justify-end items-end">
                                            <View style={{height: 1, backgroundColor: "#44444422"}} className="w-[80%] "/>
                                        </View>


                                    </>
                                )
                            }}/>
                    </View>

                    <View className="absolute bottom-12 w-full flex justify-center items-center">
                        <TouchableOpacity
                            onPress={handleClearRideHistory}
                            style={{backgroundColor: "#ff0000"}}
                            className="rounded-full px-4 py-3 flex justify-center items-center">
                            <Text className="font-GoogleSansMedium text-general text-base leading-5">Clear Ride History</Text>
                        </TouchableOpacity>
                    </View>

                </View>

            }

        </View>
    )
}
export default Index
