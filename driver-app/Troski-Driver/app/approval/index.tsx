import {View, Text, Modal, TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";

const Index = () => {
    const [ showModal, setShowModal ] = useState(true);
    const router = useRouter();

    const handleApprovalModal = ()=>{
        setShowModal(false);
        router.replace("/")

    };

    const handleCallCustomerCare = () =>{

    };

    const handleCheckApprovalStatus = () => {

    };


    return (
        <View className="flex-1  bg-general">

            <Modal visible={showModal} animationType="fade">

                <View className="flex-1 bg-general">

                    <View style={{top: 53, left: 16}} className="absolute z-10">
                        <TouchableOpacity
                            onPress={handleApprovalModal}
                            className="p-2 bg-tertiaryWhite rounded-full"
                        >
                            <Ionicons name="close" size={26} color="black" />
                        </TouchableOpacity>
                    </View>


                    <View className="flex-1 w-full justify-center items-center flex flex-col">

                        <Text className="text-xl leading-tight tracking-tighter text-secondaryBlack  font-GoogleSansMedium mb-4">
                            Troski Driver profile completed successfully
                        </Text>
                        <Text className="text-base leading-tight tracking-tight text-secondaryBlack  font-GoogleSansRegular mb-4">
                            Awaiting approval in 2-3 business days.
                        </Text>

                    </View>

                    <View className="absolute w-full bottom-12 flex flex-col gap-3 justify-center items-center">
                        <PrimaryButton
                            name="Check approval status"
                            onPress={handleCheckApprovalStatus}
                            disabled={false}
                        />

                        <SecondaryButton
                            title="Call customer care"
                            onPress={handleCallCustomerCare}
                        />

                    </View>
                </View>

            </Modal>
        </View>
    )
}
export default Index
