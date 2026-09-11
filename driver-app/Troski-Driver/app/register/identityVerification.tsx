import {View, Text, TouchableOpacity, Image, Modal, ActivityIndicator} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {useAppStore} from "@/utils/store";
import {Ionicons} from "@expo/vector-icons";
import VerificationInput from "@/components/VerificationInput";
import * as ImagePicker from "expo-image-picker";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import PrimaryButton from "@/components/PrimaryButton";
import {useRouter} from "expo-router";
import LottieView from "lottie-react-native";

const IdentityVerification = () => {

    const router = useRouter();
    const [ showLoading, setShowLoading ] = useState(false);

    const driverlicenseid = useAppStore((state)=> state.driverlicenseid);
    const ghanacardnumber = useAppStore((state)=> state.ghanacardnumber);
    const ghanacardphoto = useAppStore((state)=> state.ghanacardphoto);
    const driverlicensephoto = useAppStore((state)=> state.driverlicensephoto);
    const licenseexpirydate = useAppStore((state)=> state.licenseexpirydate);


    const setDriverLicenseID = useAppStore((state)=> state.setDriverLicenseID);
    const setGhanaCardNumber = useAppStore((state)=> state.setGhanaCardNumber);
    const setGhanaCardPhoto = useAppStore((state)=> state.setGhanaCardPhoto);
    const setDriverLicensePhoto = useAppStore((state)=> state.setDriverLicensePhoto);
    const setLicenseExpiryDate = useAppStore((state)=> state.setLicenseExpiryDate);


    const [uploadingGhanaCard, setUploadingGhanaCard] = useState(false);
    const [uploadingDriverLicense, setUploadingDriverLicense] = useState(false);

    const handleGhanaCardPicker = async () => {
        try {
            setUploadingGhanaCard(true);

            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                alert("Permission to access gallery is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 1,
                allowsEditing: true,
            });

            if (!result.canceled) {
                setGhanaCardPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setUploadingGhanaCard(false);
        }
    };


    const handleDriverLicensePicker = async () => {
        try {
            setUploadingDriverLicense(true);

            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                alert("Permission to access gallery is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 1,
                allowsEditing: true,
            });

            if (!result.canceled) {
                setDriverLicensePhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setUploadingDriverLicense(false);
        }
    };



    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\D/g, "");

        if (cleaned.length <= 2) return cleaned;

        return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    };


    const isDisabled =
        !driverlicenseid ||
        driverlicenseid.length < 10 ||
        !ghanacardnumber ||
        ghanacardnumber.length < 10 ||
        !ghanacardphoto ||
        !driverlicensephoto ||
        !licenseexpirydate ||
        licenseexpirydate.length !== 5;


    const handleVerifyIdentity = () => {
        setShowLoading(true);

        setTimeout(() => {
            setShowLoading(false);
            router.push("/register/verificationChecklist");
        }, 3000);
    };

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
                        <Text className="text-3xl leading-tight tracking-tighter text-secondaryBlack  font-GoogleSansMedium">Verify your identity</Text>
                        <Text className="text-sm leading-tight  text-secondaryGray  font-GoogleSansRegular">
                            We need a few details to confirm your identity and keep the platform secure.
                        </Text>
                    </View>


                    <View className="w-full flex flex-col justify-center items-start gap-6 pt-8">
                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-tight tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Driver License ID
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>


                            <VerificationInput
                                value={driverlicenseid}
                                onChangeText={setDriverLicenseID}
                                placeholder="Enter your Driver's License ID"
                                autoFocus={true}
                                error={
                                    driverlicenseid.length > 0 && driverlicenseid.length < 10
                                        ? "Please enter a valid Driver License ID"
                                        : ""
                                }
                            />

                        </View>

                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-tight tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Ghana Card Number
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>


                            <VerificationInput
                                value={ghanacardnumber}
                                onChangeText={setGhanaCardNumber}
                                placeholder="Enter your Ghana Card number"
                                error={
                                    ghanacardnumber.length > 0 && ghanacardnumber.length < 10
                                        ? "Please enter a valid Ghana Card number"
                                        : ""
                                }
                            />

                        </View>

                        <View className="w-full gap-2">
                            <View className="flex flex-col mb-2 gap-1">
                                <View className="w-full flex flex-row  items-center gap-2">

                                    <Text
                                        style={{paddingLeft: 8, }}
                                        className="text-base leading-tight tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Ghana Card Photo
                                    </Text>
                                    <Ionicons name="star" size={6} color="red"/>
                                </View>

                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-xs leading-tight  text-secondaryGray/50  font-GoogleSansRegular">Upload photo of your Ghana card
                                </Text>
                            </View>



                            {ghanacardphoto ? (
                                <View className="border-2 border-dashed border-secondaryBlack w-28 h-28 justify-center items-center p-2 rounded-2xl">
                                    <TouchableOpacity
                                        className="w-24 h-24 rounded-2xl bg-tertiaryWhite"
                                        onPress={handleGhanaCardPicker}
                                        disabled={uploadingGhanaCard}
                                    >
                                        <Image
                                            source={{ uri: ghanacardphoto }}
                                            className="w-full h-full rounded-2xl"
                                            resizeMode="cover"
                                        />

                                        <View className="absolute bottom-1 right-1">
                                            {uploadingGhanaCard ? (
                                                <ActivityIndicator size="small" color="#000" />
                                            ) : (
                                                <Ionicons name="create" size={24} color="black" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="border-2 border-dashed border-secondaryBlack/50 w-28 h-28 justify-center items-center p-2 rounded-2xl">
                                    <TouchableOpacity
                                        className="w-24 h-24 rounded-2xl bg-tertiaryWhite items-center justify-center"
                                        onPress={handleGhanaCardPicker}
                                        disabled={uploadingGhanaCard}
                                    >
                                        {uploadingGhanaCard ? (
                                            <ActivityIndicator size="small" color="#ffcc00" />
                                        ) : (
                                            <Ionicons name="add-circle" size={32} color="#ffcc00" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                        </View>

                        <View className="w-full gap-2">
                            <View className="flex flex-col mb-2 gap-1">

                                <View className="w-full flex flex-row  items-center gap-2">
                                    <Text
                                        style={{paddingLeft: 8, }}
                                        className="text-base leading-tight tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Driver&apos; License Photo
                                    </Text>
                                    <Ionicons name="star" size={6} color="red"/>
                                </View>

                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-xs leading-tight  text-secondaryGray/50  font-GoogleSansRegular">Upload photo of your Driver License
                                </Text>
                            </View>


                            {driverlicensephoto ? (
                                <View className="border-2 border-dashed border-secondaryBlack w-28 h-28 justify-center items-center p-2 rounded-2xl">
                                    <TouchableOpacity
                                        className="w-24 h-24 rounded-2xl bg-tertiaryWhite"
                                        onPress={handleDriverLicensePicker}
                                        disabled={uploadingDriverLicense}
                                    >
                                        <Image
                                            source={{ uri: driverlicensephoto }}
                                            className="w-full h-full rounded-2xl"
                                            resizeMode="cover"
                                        />

                                        <View className="absolute bottom-1 right-1">
                                            {uploadingDriverLicense ? (
                                                <ActivityIndicator size="small" color="#000" />
                                            ) : (
                                                <Ionicons name="create" size={24} color="black" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="border-2 border-dashed border-secondaryBlack/50 w-28 h-28 justify-center items-center p-2 rounded-2xl">
                                    <TouchableOpacity
                                        className="w-24 h-24 rounded-2xl bg-tertiaryWhite items-center justify-center"
                                        onPress={handleDriverLicensePicker}
                                        disabled={uploadingDriverLicense}
                                    >
                                        {uploadingDriverLicense ? (
                                            <ActivityIndicator size="small" color="#ffcc00" />
                                        ) : (
                                            <Ionicons name="add-circle" size={32} color="#ffcc00" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                        </View>

                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row  items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8, }}
                                    className="text-base leading-tight tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Expiry date of license
                                </Text>
                                <Ionicons name="star" size={6} color="red"/>
                            </View>


                            <VerificationInput
                                value={licenseexpirydate}
                                onChangeText={(text) =>
                                    setLicenseExpiryDate(formatExpiryDate(text))
                                }
                                placeholder="MM/YY"
                                keyboardType="number-pad"
                                error={
                                    licenseexpirydate.length > 0 && licenseexpirydate.length < 5
                                        ? "Enter expiry date as MM/YY"
                                        : ""
                                }
                            />

                        </View>

                        <View className="w-full flex justify-center mt-4 gap-2 items-center">

                            {isDisabled?
                                <DisabledPrimaryButton
                                    name="Verify identity"
                                />
                                :
                                <PrimaryButton
                                    name="Verify identity"
                                    onPress={handleVerifyIdentity}
                                    disabled={isDisabled}
                                />
                            }

                        </View>

                    </View>



                </View>


                <Modal statusBarTranslucent visible={showLoading} animationType="fade">
                    <StatusBar style="dark"/>
                    <View className="flex-1 w-full justify-center items-center bg-general">
                        <LottieView
                            source={require("../../assets/video/loadingdotsblack.json")}
                            autoPlay
                            loop
                            style={{
                                width: 300,
                                height: 300,
                            }}
                        />
                    </View>
                </Modal>


            </KeyboardAwareScrollView>
        </View>
    )
}
export default IdentityVerification
