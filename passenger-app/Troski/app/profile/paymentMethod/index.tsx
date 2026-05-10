import {View, Text, TouchableOpacity, Alert, ScrollView} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAppStore} from "@/utils/store";
import PrimaryButton from "@/components/PrimaryButton";

const Index = () => {
    const paymentMethods = useAppStore((state) => state.paymentMethods);
    const removePaymentMethod = useAppStore((state)=>state.removePaymentMethod);


    const hasPaymentMethod = paymentMethods.length > 0;
    const clearPaymentMethod = useAppStore((state)=>state.clearPaymentMethod);

    const handleDeletePaymentMethod = (index: any) => {
        Alert.alert(
            "Delete Payment Method?",
            "You are about to permanently delete your payment method.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => removePaymentMethod(index)
                }
            ]
        );
    };

    return (

        <View style={{backgroundColor: "#F5F7FA", flex: 1}} className="w-full">

            {!hasPaymentMethod?
                <View style={{flex: 1, marginTop: "-20%"}} className="w-full flex justify-center items-center">
                    <Ionicons style={{marginBottom: 10}} name="cash-outline" size={100} color="gray"/>
                    <Text className="font-GoogleSansMedium">No Payment Method.</Text>
                    <Text style={{marginBottom: 16}} className="font-GoogleSansRegular text-center flex-shrink">Add a payment method to see it here.</Text>

                    <TouchableOpacity onPress={()=>router.push("/profile/paymentMethod/setupPaymentMethod")} style={{paddingHorizontal: 12, paddingVertical: 12}} className="bg-primary rounded-full flex justify-center items-center">
                        <Text className="font-GoogleSansMedium">Setup Payment Method</Text>
                    </TouchableOpacity>
                </View>


                :


                <>
                <ScrollView>
                    <View style={{ paddingLeft: 16, paddingRight: 16, flex: 1}} className="w-full">
                        {paymentMethods.map((item:any, index:any) => (
                            <View
                                key={index}
                                style={{
                                    height: 72,
                                    borderRadius: 24,
                                    backgroundColor: "#a9a9a933",
                                    paddingLeft: 20,
                                    paddingRight: 20,
                                    marginBottom: 12
                                }}
                                className="w-full flex flex-row justify-between items-center"
                            >
                                <Ionicons name="card" size={32} color="black"/>

                                <View style={{width: "50%", gap: 2}}>
                                    <Text className="font-GoogleSansBold">
                                        {item.provider}
                                    </Text>

                                    <Text className="font-GoogleSansRegular">
                                        {item.number}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleDeletePaymentMethod(index)}
                                    style={{padding: 8, backgroundColor: "#44444422"}}
                                    className="rounded-full"
                                >
                                    <Ionicons name="trash-bin" size={24} color="red"/>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                    <View className="absolute flex justify-center items-center w-full"
                          style={{bottom: 0, height: 100}}>
                        <PrimaryButton name="Add payment method" onPress={()=>router.push("/profile/paymentMethod/setupPaymentMethod")} disabled={false}/>
                    </View>
                </>
            }

        </View>

    )
}
export default Index
