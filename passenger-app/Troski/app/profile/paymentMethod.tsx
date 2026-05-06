import {View, Text, TouchableOpacity, Alert} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAppStore} from "@/utils/store";

const PaymentMethod = () => {
    const [isVisible, setIsVisible] = useState(false);
    const serviceprovider = useAppStore((state)=>state.serviceprovider)
    const number = useAppStore((state)=>state.number)


    const handleDeletePaymentMethod= () =>{
        Alert.alert("Delete Payment Method?", "You are about to permanently delete your payment method. This action cannot be reversed.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: ()=>setIsVisible(true)


                }


            ])
    }

    return (

        <View style={{backgroundColor: "#F5F7FA", flex: 1}} className="w-full">

            {isVisible?
                <View style={{flex: 1, marginTop: "-20%"}} className="w-full flex justify-center items-center">
                    <Ionicons style={{marginBottom: 10}} name="cash-outline" size={100} color="gray"/>
                    <Text className="font-GoogleSansMedium">No Payment Method.</Text>
                    <Text style={{marginBottom: 16}} className="font-GoogleSansRegular text-center flex-shrink">Add a payment method to see it here.</Text>

                    <TouchableOpacity onPress={()=>router.push("/profile/setupPaymentMethod")} style={{paddingHorizontal: 12, paddingVertical: 12}} className="bg-primary rounded-full flex justify-center items-center">
                        <Text className="font-GoogleSansMedium">Setup Payment Method</Text>
                    </TouchableOpacity>
                </View>


                :


                <View style={{ paddingLeft: 16, paddingRight: 16}} className="w-full flex justify-center items-center">
                    <View
                        style={{height: 72, borderRadius: 24, backgroundColor: "#a9a9a933", paddingLeft: 20, paddingRight: 20,}}
                        className="w-full flex flex-row justify-between items-center">
                        <View>
                            <Ionicons name="card" size={32} color="black"/>

                        </View>


                        <View
                            style={{width: "50%", gap: 2,  }}
                            className="flex  flex-col justify-start items-center ">

                            <View className="w-full flex flex-row gap-2 items-center ">
                                <Text className="font-GoogleSansBold">
                                    {serviceprovider}
                                </Text>
                            </View>

                            <View className="flex flex-row justify-start items-center w-full gap-2">

                                <Text className=" font-GoogleSansRegular">
                                    {number}
                                </Text>

                            </View>



                        </View>

                        <TouchableOpacity
                            onPress={handleDeletePaymentMethod}
                            style={{paddingHorizontal: 8, paddingVertical: 8, backgroundColor: "#44444422"}}
                            className="flex rounded-full  justify-center items-center">
                            <Ionicons name="trash-bin" size={24} color="red"/>
                        </TouchableOpacity>

                    </View>




                </View>
            }

        </View>
    )
}
export default PaymentMethod
