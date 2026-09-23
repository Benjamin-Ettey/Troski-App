import {View, Text,TouchableOpacity, Alert, SectionList} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

const RecentNotifications = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const { colorScheme } = useColorScheme();

    const DATA = [
        {date: "Jan 2026",

            data:[
                {id: 1, subject: "Book your ride today", message: "Your driver is awaiting at the junction.", time: "2min ago" },
                {id: 2, subject: "Troski just got it first ever", message: "Glad to have you in", time: "monday" },
                {id: 3, subject: "Hello, I'm Tsumasi...", message: "How's Troski treating you.", time: "first week" },
                {id: 4, subject: "Your wallet is safe", message: "We manage your transactions with integrity.", time: "4th week" },
                {id: 5, subject: "Book faster, Book safely", message: "We've got you covered", time: "last 2 weeks" },
            ]
        },

        {date: "Feb 2026",
            data:[
                {id: 6, subject: "Book your faster trip to the beach", message: "Yenko chilli!", time: "2min ago" },
                {id: 7, subject: "Your wallet is safe", message: "We manage your transactions with integrity.", time: "2nd week" },
                {id: 8, subject: "Book faster, Book safely", message: "With smart technology", time: "last week" },
                {id: 9, subject: "Book your faster trip to the beach", message: "Join your friends as you chill.", time: "3rd week" },
                {id: 10, subject: "Troski just got it first ever", message: "Glad to have you in", time: "4th weeks"},
            ]
        },



    ];

    const handleClearNotifications = ()=>{
        Alert.alert(
            "Delete Recent Notifications?", "You are about to permanently delete all your recent notifications. This action cannot be reversed.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: ()=>setShowNotifications(true)

                }


            ]
        )

    }



    return (


        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA", flex: 1}} className="w-full">

            {showNotifications?
                <View style={{ marginTop: "-20%"}} className="w-full flex-1 flex justify-center items-center">
                    <Ionicons className="mt-3" name="notifications-off" size={100} color="gray"/>
                    <Text className="font-GoogleSansMedium dark:text-general text-secondaryBlack text-xl tracking-tighter leading-6">No Recent Notifications.</Text>
                    <Text style={{marginBottom: 16}} className="font-GoogleSansRegular text-center flex-shrink dark:text-tertiaryWhite text-sm leading-4">All your recent notifications will appear here.</Text>

                </View>
                :
                <View style={{paddingLeft: 16}} className="w-full flex items-center">
                    <View style={{borderRadius: 32, }} >
                        <SectionList
                            contentContainerStyle={{paddingBottom: 100}}
                            sections={DATA}
                            keyExtractor={(item)=>item.id.toString()}

                            renderSectionHeader={({section})=>{
                                return(
                                    <View className="px-4 mt-7">
                                        <Text className="font-GoogleSansMedium  text-xl dark:text-general leading-5">{section.date}</Text>
                                    </View>
                                )
                            }}

                            renderItem={({item})=>{
                                return(

                                    <>
                                        <View
                                            className="w-full px-6 h-20 flex flex-row justify-between items-center">
                                            <View className="rounded-full p-2" style={{backgroundColor: "black"}}>
                                                <Ionicons name="notifications" size={24} color="#ffcc00"/>

                                            </View>


                                            <View
                                                style={{paddingLeft: 16 }}
                                                className="flex flex-1 gap-1 flex-col justify-center items-center ">
                                                <View className="flex flex-row justify-start items-center w-full gap-2">
                                                    <Text numberOfLines={1} className="text-xl leading-5 font-GoogleSansRegular dark:text-general">
                                                        {item.subject}
                                                    </Text>

                                                </View>

                                                <View className="w-full flex flex-row gap-2 items-center ">
                                                    <Text
                                                        numberOfLines={2}
                                                        className=" text-secondaryBlack font-GoogleSansRegular text-base leading-5 rounded-full dark:text-tertiaryGray">{item.message}</Text>
                                                </View>
                                            </View>

                                            <View
                                                style={{width: 84, height: 32, paddingHorizontal: 2, }}
                                                className="rounded-full flex justify-center items-center">
                                                <Text
                                                    style={{paddingHorizontal: 4, fontSize: 12}}
                                                    className=" text-secondaryBlack font-GoogleSansRegular rounded-full dark:text-tertiaryGray">{item.time}</Text>

                                            </View>

                                        </View>

                                        <View className="w-full flex justify-end items-end">
                                            <View style={{height: 1, backgroundColor: colorScheme === "dark"? "#a9a9a922": "#44444422"}} className="w-[80%] "/>
                                        </View>


                                    </>
                                )
                            }}/>
                    </View>

                    <View className="absolute bottom-10 h-14 w-full flex justify-center items-center">
                        <TouchableOpacity
                            onPress={handleClearNotifications} style={{paddingHorizontal: 12, backgroundColor: "#ff0000"}}
                            className="rounded-full h-12 flex justify-center items-center">
                            <Text className="font-GoogleSansMedium text-general text-base leading-5">Clear all recent notifications</Text>
                        </TouchableOpacity>
                    </View>

                </View>

            }

        </View>
    )
}
export default RecentNotifications
