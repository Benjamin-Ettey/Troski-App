import {View, Text, TouchableOpacity, SectionList, Alert} from 'react-native'
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
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA", flex: 1}} className="w-full">
            <View style={{height: "30%", marginBottom: 16 }} className="w-full flex flex-col justify-center items-center">
                <View style={{ marginBottom: 10, paddingHorizontal: 10, paddingVertical: 5}} className="rounded-full bg-secondaryBlack flex flex-row justify-center items-center">
                    <Ionicons style={{marginRight: 8}} name="wallet-outline" size={16} color="white"/>
                    <Text style={{fontSize: 16}}  className=" font-GoogleSansMedium  text-general text-center flex-shrink ">Total Balance</Text>
                </View>

                <Text
                    style={{fontSize: 40, marginBottom: 30}}
                    className=" font-GoogleSansMedium text-center flex-shrink dark:text-general">GH₵10.50
                </Text>
                <View
                    style={{gap: 48}}
                    className="w-full flex flex-row justify-center items-center">
                    <View>
                        <TouchableOpacity
                            onPress={()=>router.push("/profile/myWallet/deposit")}
                            className="rounded-full bg-primary flex justify-center items-center"
                            style={{width: 60, height: 60, marginBottom: 10}}>
                            <Ionicons name="add-circle-outline" size={32}/>
                        </TouchableOpacity>
                        <Text className="font-GoogleSansMedium text-center flex-shrink dark:text-tertiaryGray">Deposit</Text>
                    </View>
                    <View>
                        <TouchableOpacity
                            onPress={()=>router.push("/profile/myWallet/withdraw")}

                            className="rounded-full bg-primary flex justify-center items-center"
                            style={{width: 60, height: 60, marginBottom: 10}}>
                            <Ionicons name="cash-outline" size={32}/>
                        </TouchableOpacity>
                        <Text className="font-GoogleSansMedium text-center flex-shrink dark:text-tertiaryGray">Withdraw</Text>

                    </View>
                </View>
            </View>


            <View style={{paddingLeft: 20}} className="w-full flex flex-row items-center">
                <Text style={{fontSize: 16, paddingRight: 20}} className="font-GoogleSansMedium dark:text-general">Transaction History</Text>
                <View style={{height: 1, width: "50%"}} className="bg-tertiaryGray dark:bg-secondaryGray"/>
            </View>

            <View style={{flex: 1}} className="w-full items-center">
                {showRideHistory?
                    <View style={{flex: 1}} className="w-full flex justify-center items-center">
                        <Ionicons style={{marginBottom: 10}} name="list-outline" size={100} color="gray"/>
                        <Text className="font-GoogleSansMedium dark:text-general">No Transaction History</Text>
                        <Text style={{marginBottom: 16}} className="font-GoogleSansRegular text-center flex-shrink dark:text-tertiaryGray">Your transaction history will appear here.</Text>


                    </View>
                    :
                    <View style={{paddingLeft: 16}} className="w-full flex items-center">
                        <View style={{borderRadius: 32, marginTop: 4}} >
                            <SectionList
                                contentContainerStyle={{paddingBottom: 100}}
                                sections={DATA}
                                keyExtractor={(item)=>item.id.toString()}

                                renderSectionHeader={({section})=>{
                                    return(
                                        <View style={{paddingHorizontal: 16, marginTop: 24}}>
                                            <Text className="font-GoogleSansMedium text-xl dark:text-general">{section.date}</Text>
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
                                                    <Ionicons name="receipt-outline" size={32} color={colorScheme === "dark"? "#ffffff":"black"}/>

                                                </View>


                                                <View
                                                    style={{width: "50%", gap: 2, }}
                                                    className="flex  flex-col justify-center items-center ">
                                                    <View className="flex flex-row justify-start items-center w-full gap-2">
                                                        <Text className="text-xl font-GoogleSansRegular dark:text-general">
                                                            {item.from}
                                                        </Text>

                                                        <Ionicons name="arrow-forward" size={12} color= {colorScheme === "dark"? "#e4e4e4":"black"}/>

                                                        <Text className="text-xl font-GoogleSansRegular dark:text-general">
                                                            {item.to}
                                                        </Text>
                                                    </View>

                                                    <View className="w-full flex flex-row gap-2 items-center ">
                                                        <Text
                                                            style={{paddingHorizontal: 4, fontSize: 12}}
                                                            className=" text-secondaryBlack font-GoogleSansRegular dark:text-tertiaryWhite rounded-full">{item.date}</Text>


                                                    </View>
                                                </View>

                                                <View
                                                    style={{width: 84, height: 32, paddingHorizontal: 2}}
                                                    className="rounded-full bg-primary flex justify-center items-center">
                                                    <Text numberOfLines={1} className="font-GoogleSansBold text-sm">{item.price}</Text>
                                                </View>

                                            </View>

                                            <View className="w-full flex justify-end items-end">
                                                <View style={{height: 1, backgroundColor: colorScheme === "dark"? "#e4e4e422":"#44444422"}} className="w-[80%] "/>
                                            </View>


                                        </>
                                    )
                                }}/>
                        </View>

                        <View style={{ bottom: 0, height: "15%"}} className="absolute w-full flex justify-center items-center">
                            <TouchableOpacity onPress={handleClearRideHistory}
                                style={{paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#ff0000"}}
                                className=" rounded-full flex justify-center items-center">
                                <Text style={{color: "white"}} className="font-GoogleSansMedium">Clear Ride History</Text>
                            </TouchableOpacity>
                        </View>

                    </View>

                }
            </View>

        </View>
    )
}
export default Index
