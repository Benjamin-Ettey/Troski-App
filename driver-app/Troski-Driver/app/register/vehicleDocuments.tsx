import {View, Text, TouchableOpacity, Image} from 'react-native'
import React from 'react'
import {KeyboardAwareScrollView} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {useAppStore} from "@/utils/store";
import VerificationInput from "@/components/VerificationInput";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import PrimaryButton from "@/components/PrimaryButton";
import {useRouter} from "expo-router";

const VehicleDocuments = () => {

    const router = useRouter();

    const insurancecertificatephoto = useAppStore((state) => state.insurancecertificatephoto);
    const vehicleregistrationdocumentphoto = useAppStore((state) => state.vehicleregistrationdocumentphoto);
    const dvlaroadworthyexpirydate = useAppStore((state) => state.dvlaroadworthyexpirydate);

    const setInsuranceCertificatePhoto = useAppStore((state) => state.setInsuranceCertificatePhoto);
    const setVehicleRegistrationDocumentPhoto = useAppStore((state) => state.setVehicleRegistrationDocumentPhoto);
    const setDvlaRoadworthyExpiryDate = useAppStore((state) => state.setDvlaRoadworthyExpiryDate);


    const handleInsuranceCertificatePhoto = async () => {

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
            setInsuranceCertificatePhoto(result.assets[0].uri)
        }
    };

    const handleVehicleRegistrationDocumentPhoto = async () => {

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
            setVehicleRegistrationDocumentPhoto(result.assets[0].uri)
        }
    };



    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\D/g, "");

        if (cleaned.length <= 2) return cleaned;

        return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    };


    const isDisabled =
        !insurancecertificatephoto ||
        !vehicleregistrationdocumentphoto ||
        !dvlaroadworthyexpirydate ||
        dvlaroadworthyexpirydate.trim().length !== 5;

    const handleVehicleDocuments = ()=> {

        router.push("/register/routePreference")
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

                <View className="w-full flex-1 flex items-center px-6 mt-4" >


                    <View className="w-full gap-2">
                        <View className="flex flex-col mb-2 gap-1">
                            <View className="w-full flex flex-row  items-center gap-2">

                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Insurance certificate
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>

                            <Text
                                style={{paddingLeft: 8, }}
                                className="text-xs leading-none  text-secondaryGray/50  font-GoogleSansRegular">Upload photo of your insurance certificate
                            </Text>
                        </View>



                        {insurancecertificatephoto ? (
                            <View className="border-2 border-dashed border-secondaryBlack w-28 h-28 justify-center items-center p-2 rounded-2xl">

                                <TouchableOpacity
                                    className="w-24 h-24 rounded-2xl bg-tertiaryWhite"
                                    onPress={handleInsuranceCertificatePhoto}
                                >
                                    <Image
                                        source={{ uri: insurancecertificatephoto }}
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
                                    onPress={handleInsuranceCertificatePhoto}
                                >
                                    <Ionicons name="add-circle" size={32} color="#ffcc00" />
                                </TouchableOpacity>
                            </View>

                        )}

                    </View>

                    <View className="w-full gap-2 mt-6">
                        <View className="flex flex-col mb-2 gap-1">
                            <View className="w-full flex flex-row  items-center gap-2">

                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Vehicle registration document
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>

                            <Text
                                style={{paddingLeft: 8, }}
                                className="text-xs leading-none  text-secondaryGray/50  font-GoogleSansRegular">Upload photo of your registration document
                            </Text>
                        </View>



                        {vehicleregistrationdocumentphoto ? (
                            <View className="border-2 border-dashed border-secondaryBlack w-28 h-28 justify-center items-center p-2 rounded-2xl">

                                <TouchableOpacity
                                    className="w-24 h-24 rounded-2xl bg-tertiaryWhite"
                                    onPress={handleVehicleRegistrationDocumentPhoto}
                                >
                                    <Image
                                        source={{ uri: vehicleregistrationdocumentphoto }}
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
                                    onPress={handleVehicleRegistrationDocumentPhoto}
                                >
                                    <Ionicons name="add-circle" size={32} color="#ffcc00" />
                                </TouchableOpacity>
                            </View>

                        )}

                    </View>


                    <View className="w-full gap-2 mt-6">
                        <View className="w-full flex flex-row  items-center gap-2">
                            <Text
                                style={{paddingLeft: 8, }}
                                className="text-base leading-none tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Expiry date of license
                            </Text>
                            <Ionicons name="star" size={6} color="red"/>
                        </View>


                        <VerificationInput
                            value={dvlaroadworthyexpirydate}
                            onChangeText={(text) =>
                                setDvlaRoadworthyExpiryDate(formatExpiryDate(text))
                            }
                            placeholder="MM/YY"
                            keyboardType="number-pad"
                            error={
                                (dvlaroadworthyexpirydate?.length ?? 0) > 0 &&
                                dvlaroadworthyexpirydate.length < 5
                                    ? "Enter expiry date as MM/YY"
                                    : ""
                            }
                        />

                    </View>


                    <View className="w-full flex justify-center mt-6 gap-2 items-center">

                        {isDisabled?
                            <DisabledPrimaryButton
                                name="Continue"
                            />
                            :
                            <PrimaryButton
                                name="Continue"
                                onPress={handleVehicleDocuments}
                                disabled={isDisabled}
                            />
                        }

                    </View>

                </View>
            </KeyboardAwareScrollView>
        </View>
    )
}
export default VehicleDocuments
