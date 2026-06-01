import {View, Text, TouchableOpacity, Image} from 'react-native'
import React from 'react'
import {KeyboardAwareScrollView} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import VerificationInput from "@/components/VerificationInput";
import {useAppStore} from "@/utils/store";
import * as ImagePicker from "expo-image-picker";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import PrimaryButton from "@/components/PrimaryButton";

const VehicleDetails = () => {

    const router = useRouter();
    const vehiclePlateRegex = /^[A-Z]{1,3}\s?\d{1,4}[- ]?\d{2}$/i;

    const vehicletype = useAppStore((state) => state.vehicletype);
    const vehiclenumberplate = useAppStore((state) => state.vehiclenumberplate);
    const vehiclecolor = useAppStore((state) => state.vehiclecolor);
    const vehiclecapacity = useAppStore((state) => state.vehiclecapacity);
    const vehiclephoto = useAppStore((state) => state.vehiclephoto);

    const setVehicleType = useAppStore((state) => state.setVehicleType);
    const setVehicleNumberPlate = useAppStore((state) => state.setVehicleNumberPlate);
    const setVehicleColor = useAppStore((state) => state.setVehicleColor);
    const setVehicleCapacity = useAppStore((state) => state.setVehicleCapacity);
    const setVehiclePhoto = useAppStore((state) => state.setVehiclePhoto);

    const handleVehiclePhoto = async () => {

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted){
            alert("Permission to access gallery is required!")
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 1,
            allowsEditing: true,
        });
        if (!result.canceled){
            setVehiclePhoto(result.assets[0].uri)
        }
    };

    const isDisabled =
        !vehicletype ||
        vehicletype.trim().length < 2 ||
        !vehiclePlateRegex.test(vehiclenumberplate.trim()) ||
        !vehiclecolor ||
        vehiclecolor.trim().length < 2 ||
        !vehiclecapacity ||
        Number(vehiclecapacity) <= 0 ||
        !vehiclephoto;


    const handleConfirmVehicleDetails = ()=>{

        router.push("/register/vehicleDocuments")
    }


    return (
        <View className="flex-1  bg-general">
            <KeyboardAwareScrollView
                bottomOffset={200}
                contentContainerStyle={{paddingBottom: 100}}
                keyboardShouldPersistTaps="handled"
                className="flex-1"
            >

                <StatusBar style="dark"/>

                <View className="w-full flex-1 flex items-center px-6">

                    <View className="w-full py-6 flex-col gap-2">
                        <Text className="text-3xl leading-none tracking-tighter text-secondaryBlack  font-GoogleSansMedium">Fill in your vehicle details</Text>
                        <Text className="text-sm leading-none  text-secondaryGray  font-GoogleSansRegular">
                            We need a few details about your vehicle to verify it and get you ready to drive.
                        </Text>
                    </View>


                    <View className="w-full flex flex-col justify-center items-start gap-6 pt-8">

                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Vehicle type
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>


                            <VerificationInput
                                value={vehicletype}
                                onChangeText={setVehicleType}
                                autoFocus={true}
                                placeholder="Enter vehicle type"
                            />


                        </View>


                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Vehicle number plate
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>

                            <VerificationInput
                                value={vehiclenumberplate}
                                onChangeText={setVehicleNumberPlate}
                                placeholder="Enter vehicle number plate"
                                error={
                                    vehiclenumberplate.length > 0 &&
                                    !vehiclePlateRegex.test(vehiclenumberplate.trim())
                                        ? "Please enter a valid Ghana vehicle number plate"
                                        : ""
                                }
                            />



                        </View>


                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Vehicle color
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>


                            <VerificationInput
                                value={vehiclecolor}
                                onChangeText={setVehicleColor}
                                placeholder="Enter vehicle color"
                            />
                        </View>


                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Vehicle capacity
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>


                            <VerificationInput
                                value={vehiclecapacity}
                                onChangeText={setVehicleCapacity}
                                placeholder="Enter vehicle capacity"
                                keyboardType="number-pad"
                            />

                        </View>


                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Vehicle photo
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>


                            {vehiclephoto ? (
                                <View className="border-2 border-dashed border-secondaryBlack w-28 h-28 justify-center items-center p-2 rounded-2xl">

                                    <TouchableOpacity
                                        className="w-24 h-24 rounded-2xl bg-tertiaryWhite"
                                        onPress={handleVehiclePhoto}
                                    >
                                        <Image
                                            source={{ uri: vehiclephoto }}
                                            className="w-full h-full rounded-2xl"
                                            resizeMode="cover"
                                        />

                                        <View className="absolute bottom-1 right-1 ">
                                            <Ionicons name="create" size={24} color="black" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="border-2 border-dashed border-secondaryBlack/50 w-28 h-28 justify-center items-center p-2 rounded-2xl">
                                    <TouchableOpacity
                                        className="w-24 h-24 rounded-2xl bg-tertiaryWhite items-center justify-center"
                                        onPress={handleVehiclePhoto}
                                    >
                                        <Ionicons name="add-circle" size={32} color="#ffcc00" />
                                    </TouchableOpacity>
                                </View>

                            )}



                        </View>

                        <View className="w-full flex justify-center mt-4 gap-2 items-center">

                            {isDisabled?
                                <DisabledPrimaryButton
                                    name="Confirm vehicle details"
                                />
                                :
                                <PrimaryButton
                                    name="Confirm vehicle details"
                                    onPress={handleConfirmVehicleDetails}
                                    disabled={isDisabled}
                                />
                            }

                        </View>
                    </View>


                </View>

            </KeyboardAwareScrollView>
        </View>
    )
}
export default VehicleDetails
