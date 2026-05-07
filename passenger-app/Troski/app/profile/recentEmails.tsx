import {View, Text,TouchableOpacity, Alert, SectionList} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";

const RecentEmails = () => {
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


        <View style={{backgroundColor: "#F5F7FA", flex: 1}} className="w-full">

            {showRideHistory?
                <View style={{flex: 1, marginTop: "-20%"}} className="w-full flex justify-center items-center">
                    <Ionicons style={{marginBottom: 10}} name="mail-unread-outline" size={100} color="gray"/>
                    <Text className="font-GoogleSansMedium">No Recent Emails.</Text>
                    <Text style={{marginBottom: 16}} className="font-GoogleSansRegular text-center flex-shrink">All your recent emails will appear here.</Text>

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
                                                <Ionicons name="mail-unread" size={32} color="black"/>

                                            </View>


                                            <View
                                                style={{width: "50%", gap: 2, }}
                                                className="flex  flex-col justify-center items-center ">
                                                <View className="flex flex-row justify-start items-center w-full gap-2">
                                                    <Text numberOfLines={1} className="text-xl font-GoogleSansRegular">
                                                        {item.subject}
                                                    </Text>

                                                </View>

                                                <View className="w-full flex flex-row gap-2 items-center ">
                                                    <Text
                                                        style={{paddingHorizontal: 4, fontSize: 12}}
                                                        className=" text-secondaryBlack font-GoogleSansRegular rounded-full">{item.date}</Text>


                                                </View>
                                            </View>

                                            <View
                                                style={{width: 84, height: 32, paddingHorizontal: 2, backgroundColor: "#22C55E"}}
                                                className="rounded-full flex justify-center items-center">
                                                <Text numberOfLines={1} className="font-GoogleSansBold text-sm">{item.verified}</Text>
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
                        <TouchableOpacity
                            onPress={handleClearRideHistory} style={{paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#ff0000"}}
                            className="rounded-full shadow-2xl shadow-white flex justify-center items-center">
                            <Text style={{color: "white"}} className="font-GoogleSansMedium ">Clear Ride History</Text>
                        </TouchableOpacity>
                    </View>

                </View>

            }

        </View>
    )
}
export default RecentEmails
