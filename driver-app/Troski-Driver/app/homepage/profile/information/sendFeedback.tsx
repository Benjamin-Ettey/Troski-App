import {View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Modal} from 'react-native'
import React, {useState} from 'react'
import {StatusBar} from "expo-status-bar";
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {Ionicons} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import PrimaryButton from "@/components/PrimaryButton";
import {useRouter} from "expo-router";

const SendFeedback = () => {


    const [uploadingIssue, setUploadingIssue] = useState(false);
    const [technicalissuescreenshot, setTechnicalIssueScreenshot] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const [issue, setIssue] = useState("");

    const handleTechnicalIssue = async () => {
        try {
            setUploadingIssue(true);

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
                setTechnicalIssueScreenshot(result.assets[0].uri);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setUploadingIssue(false);
        }
    };

    const isDisabled = issue.length <= 3;

    const handleIssue = (text: string)=>{
        setIssue(text);
    };


    const handleSubmitTechnicalIssue = ()=>{

        setShowModal(true);

        const successtimer = setTimeout(()=>{
            setSuccess(true);
            const timer = setTimeout(()=>{
                setShowModal(false);
                setSuccess(false);
                router.back();

                return ()=>clearTimeout(timer)
            }, 3000)

            return ()=>clearTimeout(successtimer)
        }, 3000);


    };


    return (
        <View style={{backgroundColor: "#F5F7FA"}} className="flex-1">
            <StatusBar style="dark"/>

            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{paddingBottom: 100}}
                className="flex-1"
            >

                <View className="w-full flex-1 flex items-center px-6">

                    <View className="w-full mt-4 gap-4">
                        <View className="w-full px-4">
                            <Text className="text-sm leading-tight tracking-tight text-secondaryBlack  font-GoogleSansRegular">
                                For other issues like spam or scams, you can get help or contact support from the <Text className="font-GoogleSansBold text-sm">Help Center.</Text>
                            </Text>
                        </View>

                        <TextInput
                            value={issue}
                            onChangeText={handleIssue}
                            autoCorrect={false}
                            autoFocus
                            multiline
                            maxLength={255}
                            placeholder="Describe the technical issue"
                            textAlignVertical="top"
                            className="flex-1 rounded-3xl bg-tertiaryGray/10 py-3 px-4 text-base leading-tight text-secondaryBlack font-GoogleSansRegular"
                            style={{ height: 144 }}
                        />


                        <View className="mt-4 w-full flex-col">
                            <Text
                                className="text-base leading-tight tracking-tight  text-secondaryBlack  font-GoogleSansMedium">Screenshot <Text className="font-GoogleSansRegular text-sm text-secondaryGray">(optional)</Text>
                            </Text>

                            <Text
                                className="text-xs leading-tight  text-secondaryGray/50  font-GoogleSansRegular">Upload screenshot of technical issue
                            </Text>

                            <View className="w-full mt-4">
                                {technicalissuescreenshot ? (
                                    <View className="border-2 border-dashed border-secondaryBlack w-28 h-28 justify-center items-center p-2 rounded-2xl">
                                        <TouchableOpacity
                                            className="w-24 h-24 rounded-2xl bg-tertiaryWhite"
                                            onPress={handleTechnicalIssue}
                                            disabled={uploadingIssue}
                                        >
                                            <Image
                                                source={{ uri: technicalissuescreenshot }}
                                                className="w-full h-full rounded-2xl"
                                                resizeMode="cover"
                                            />

                                            <View className="absolute bottom-1 right-1">
                                                {uploadingIssue ? (
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
                                            onPress={handleTechnicalIssue}
                                            disabled={uploadingIssue}
                                        >
                                            {uploadingIssue ? (
                                                <ActivityIndicator size="small" color="#ffcc00" />
                                            ) : (
                                                <Ionicons name="add-circle" size={32} color="#ffcc00" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                            </View>


                            <Text
                                className="text-xs leading-tight  text-secondaryGray/50 mt-8  font-GoogleSansRegular">By sending, you allow Troski to review related technical info to help address your feedback.
                            </Text>

                            <View className="w-full flex justify-center mt-12 gap-2 items-center">

                                {isDisabled?
                                    <DisabledPrimaryButton
                                        name="Send feedback"
                                    />
                                    :
                                    <PrimaryButton
                                        name="Send feedback"
                                        onPress={handleSubmitTechnicalIssue}
                                        disabled={isDisabled}
                                    />
                                }

                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAwareScrollView>
            <KeyboardToolbar/>


            <Modal
                transparent
                visible={showModal}
                animationType="fade"
            >

                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    >
                    {success?
                        <View className="flex-col flex justify-center items-center w-full">
                            <Ionicons name="checkmark-circle" size={64} color="white"/>
                            <Text
                                className="text-sm leading-tight  text-general font-GoogleSansRegular">Request sent successfully
                            </Text>
                        </View>

                        :

                        <View className="flex-col flex w-full justify-center items-center">
                            <ActivityIndicator size="large" color="#ffffff"/>

                            <Text
                                className="text-sm leading-tight  text-general  font-GoogleSansRegular">Sending your request ...
                            </Text>
                        </View>

                    }


                </View>
            </Modal>
        </View>
    )
}
export default SendFeedback
