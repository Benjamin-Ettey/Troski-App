import {View, Text, TouchableOpacity, SectionList, Alert} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";

const Index = () => {
    const [showRideHistory, setShowRideHistory] = useState(false);


    const DATA = [
        {date: "Jan 2026",

            data:[
                {id: 1, from: "Withdrew", to: "Momo", price: "GH₵10.50", date: "15 Jan"},
                {id: 2, from: "Deposited", to: "Wallet", price: "GH₵20.00", date: "4 May"},
                {id: 3, from: "Deposited", to: "Wallet", price: "GH₵30.55", date: "2 Apr"},
                {id: 4, from: "Withdrew", to: "Momo", price: "GH₵5.50", date: "10 Feb"},
                {id: 5, from: "Deposited", to: "Wallet", price: "GH₵20.00", date: "4 May"},
            ]
        },

        {date: "Feb 2026",
            data:[
                {id: 6, from: "Withdrew", to: "Momo", price: "GH₵30.55", date: "2 Apr"},
                {id: 7, from: "Deposited", to: "Wallet", price: "GH₵5.50", date: "10 Feb"},
                {id: 8, from: "Deposited", to: "Wallet", price: "GH₵20.00", date: "4 May"},
                {id: 9, from: "Withdrew", to: "Momo", price: "GH₵30.55", date: "2 Apr"},
                {id: 10, from: "Deposited", to: "Wallet", price: "GH₵5.50", date: "10 Feb"},
            ]
        },

        {date: "Feb 2026",
            data:[
                {id: 11, from: "Deposited", to: "Wallet", price: "GH₵30.55", date: "2 Apr"},
                {id: 12, from: "Withdrew", to: "Momo", price: "GH₵5.50", date: "10 Feb"},
                {id: 13, from: "Withdrew", to: "Momo", price: "GH₵20.00", date: "4 May"},
                {id: 14, from: "Deposited", to: "Wallet", price: "GH₵30.55", date: "2 Apr"},
                {id: 15, from: "Deposited", to: "Wallet", price: "GH₵5.50", date: "10 Feb"},
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
            <View
                className="w-full mb-3 flex flex-col justify-center items-center">
                <View
                      className="rounded-full mb-3 px-3 py-2 bg-secondaryBlack flex flex-row justify-center items-center">
                    <Ionicons className="mr-2" name="wallet-outline" size={16} color="white"/>
                    <Text
                        className="text-base leading-5 font-GoogleSansMedium  text-general text-center flex-shrink ">Total Balance</Text>
                </View>

                <Text
                    className="font-GoogleSansMedium text-5xl leading-loose text-center flex-shrink text-secondaryBlack">GH₵10.50
                </Text>
                <View
                    className="w-full flex gap-14 mb-8 flex-row justify-center items-center">
                    <View>
                        <TouchableOpacity
                            onPress={()=>router.push("/homepage/profile/myWallet/deposit")}
                            className="rounded-full bg-primary h-16 w-16 mb-2 flex justify-center items-center"
                            >
                            <Ionicons name="add-circle-outline" size={32}/>
                        </TouchableOpacity>
                        <Text className="font-GoogleSansMedium text-base leading-5 text-center flex-shrink text-secondaryBlack">Deposit</Text>
                    </View>
                    <View>
                        <TouchableOpacity
                            onPress={()=>router.push("/homepage/profile/myWallet/withdraw")}
                            className="rounded-full bg-primary h-16 w-16 mb-2 flex justify-center items-center"
                            >
                            <Ionicons name="cash-outline" size={32}/>
                        </TouchableOpacity>
                        <Text className="font-GoogleSansMedium text-base leading-5 text-center flex-shrink text-secondaryBlack">Withdraw</Text>

                    </View>
                </View>
            </View>


            <View style={{paddingLeft: 20}} className="w-full flex flex-row justify-between  items-center">
                <Text className="font-GoogleSansMedium text-lg leading-5 text-secondaryBlack">Transaction History</Text>
                <View style={{height: 1, width: "50%"}} className="bg-tertiaryGray "/>
            </View>

            <View className="w-full items-center flex-1">
                {showRideHistory?
                    <View className="w-full flex flex-1 justify-center items-center">
                        <Ionicons className="mb-3" name="list-outline" size={100} color="gray"/>
                        <Text className="font-GoogleSansMedium text-xl leading-6 tracking-tighter text-secondaryBlack">No Transaction History</Text>
                        <Text style={{marginBottom: 16}} className="font-GoogleSansRegular text-sm leading-4 text-center flex-shrink text-secondaryBlack">Your transaction history will appear here.</Text>


                    </View>
                    :
                    <View style={{paddingLeft: 16}} className="w-full flex items-center">
                        <View className="mt-2" >
                            <SectionList
                                contentContainerStyle={{paddingBottom: 100}}
                                sections={DATA}
                                keyExtractor={(item)=>item.id.toString()}

                                renderSectionHeader={({section})=>{
                                    return(
                                        <View >
                                            <Text className="font-GoogleSansMedium mt-8 text-xl leading-6 text-secondaryBlack">{section.date}</Text>
                                        </View>
                                    )
                                }}

                                renderItem={({item})=>{
                                    return(

                                        <>
                                            <View
                                                className="w-full px-5 h-20 flex flex-row justify-between items-center">
                                                <View>
                                                    <Ionicons name="receipt-outline" size={32} color="black"/>

                                                </View>


                                                <View
                                                    className="flex gap-1 w-48 flex-col justify-center items-center ">
                                                    <View className="flex w-full flex-row justify-start items-center gap-2">
                                                        <Text numberOfLines={1} className="text-xl max-w-24 leading-5 font-GoogleSansRegular text-secondaryBlack">
                                                            {item.from}
                                                        </Text>

                                                        <Ionicons name="arrow-forward" size={12} color= "black"/>

                                                        <Text numberOfLines={1} className="text-xl max-w-24 leading-5 font-GoogleSansRegular text-secondaryBlack">
                                                            {item.to}
                                                        </Text>
                                                    </View>

                                                    <View className="flex w-full flex-row gap-2 justify-start items-center ">
                                                        <Text
                                                            className=" text-secondaryBlack text-sm leading-4 font-GoogleSansRegular rounded-full">{item.date}</Text>


                                                    </View>
                                                </View>

                                                <View
                                                    className="rounded-full px-3 h-9 bg-primary flex justify-center items-center">
                                                    <Text numberOfLines={1} className="font-GoogleSansBold text-sm text-secondaryBlack">{item.price}</Text>
                                                </View>

                                            </View>

                                            <View className="w-full flex justify-end items-end">
                                                <View style={{height: 1, backgroundColor: "#44444422"}} className="w-[80%] "/>
                                            </View>


                                        </>
                                    )
                                }}/>
                        </View>

                        <View className="absolute bottom-0 h-32 w-full flex justify-center items-center">
                            <TouchableOpacity onPress={handleClearRideHistory}
                                style={{ backgroundColor: "#ff0000"}}
                                className=" rounded-full flex h-12 px-4 justify-center items-center">
                                <Text className="font-GoogleSansMedium text-base leading-5 text-general">Clear Ride History</Text>
                            </TouchableOpacity>
                        </View>

                    </View>

                }
            </View>

        </View>
    )
}
export default Index
