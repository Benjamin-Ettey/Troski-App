import {View, Text, TouchableOpacity, TextInput, Keyboard, Image, Alert} from 'react-native'
import React, {useMemo, useRef, useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useAppStore} from "@/utils/store";
import {router} from "expo-router";
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from "@gorhom/bottom-sheet";
import PrimaryButton from "@/components/PrimaryButton";
import NavBar from "@/components/NavBar";
import * as ImagePicker from "expo-image-picker";


const Index = () => {
    const driveremail = useAppStore((state)=>state.driveremail);
    const driverfullname =  useAppStore((state)=> state.driverfullname);
    const drivernumber =  useAppStore((state)=> state.drivernumber);
    const driverimage = useAppStore((state) => state.driverimage);
    const setDriverFullName = useAppStore((state)=>state.setDriverFullName);
    const setDriverImage = useAppStore((state) => state.setDriverImage);



    const handleDeleteImage = ()=>{
        Alert.alert(
            "Delete Profile Photo?", "Are you sure you want to delete your profile photo? This action cannot be reversed.",
            [
                {
                    text: "No",
                    style: "cancel"
                },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: ()=> setDriverImage(null)

                }


            ]
        )

    }

    const [fullName, setFullName] = useState("")


    const handleFullName = (text: string)=>{
        setFullName(text)

        if (text.length===0) return
    }

    const handleEditFullName = () => {
        if (fullName.trim().length <= 3) return;

        setDriverFullName(fullName)
        router.replace("/homepage/profile/editProfile");
    };

    const isDisabledFullName = fullName.trim().length <= 3;


    const bottonSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(()=> ["75%", "100%"], []);
    const [editType, setEditType] = useState("");

    const openSheet = (type:any)=>{
        setEditType(type);
        bottonSheetRef.current?.expand();
    }

    const renderBackdrop = (props:any) =>

        (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior="close"
                onPress={()=>Keyboard.dismiss()}
                style={{backgroundColor: "#F5F7FA"}}
            />
    );



    const [emailAddress, setEmailAddress] = useState('')
    const setDriverEmail = useAppStore((state) => state.setDriverEmail);
    const [error, setError] = useState("");


    const isValidEmail = (email:string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isDisabledEmail = !isValidEmail(emailAddress.trim());


    const handleEditEmail = ()=>{

        if (!isValidEmail(emailAddress.trim())) {
            console.log("Invalid email");
            return;
        }

        setDriverEmail(emailAddress.trim());
        router.replace("/homepage/profile/editProfile");
    }

    const handleEmailChange = (text: string) => {
        setEmailAddress(text);

        if (text.length === 0) {
            setError("");
            return;
        }

        if (!isValidEmail(text)) {
            setError("Enter a valid email address");
        } else {
            setError("");
        }
    };

    const handleImagePicker = async () => {

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
            setDriverImage(result.assets[0].uri)
        }
    }




    return (
        <View style={{backgroundColor: "#F5F7FA", flex: 1}}>

                <>
                    <View style={{height: "30%", marginBottom: 10}} className="w-full flex justify-center items-center">
                        <View>
                            {driverimage ? (
                                <View className="w-full flex justify-center items-center">
                                    <Image
                                        className="h-52 w-52 rounded-full border-4 border-primary"
                                        source={{ uri: driverimage }}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity onPress={handleDeleteImage} style={{ marginTop: 100, marginLeft: 150, position: "absolute"}}
                                          className="flex w-14 h-14 bg-general justify-center items-center rounded-full shadow-lg shadow-black/10">
                                        <Ionicons name="trash-bin-outline" size={28} color="red"/>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View
                                    className="flex h-52 w-52 bg-primary/20 p-3 justify-center items-center rounded-full border-2 border-primary"
                                >
                                    <Ionicons name="person" color="#ffcc00" size={100} />
                                </View>
                            )}
                        </View>

                    </View>

                    <View className="w-full mb-6 px-5">

                        <View
                            style={{ backgroundColor: "#ffffff"}}
                            className="w-full rounded-full ">
                            <NavBar onPress={handleImagePicker} name="camera-outline" textcolor="#007BFF" color="#007BFF" title="Change profile photo" goforwardcolor="#ffffff"/>
                        </View>
                    </View>

                 <View className="w-full mb-6 px-5">
                    <Text
                        className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Full Name</Text>
                    <View
                        style={{backgroundColor: "#ffffff"}}
                        className="flex justify-center items-center h-14 rounded-full px-5">
                        <TouchableOpacity
                            onPress={()=>openSheet("name")}
                            className="w-full flex-1 flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-base leading-5 text-secondaryGray  ">{driverfullname}</Text>
                            <Ionicons name="create-outline" size={18} color="gray"/>
                        </TouchableOpacity>
                 </View>
                <Text
                    className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  "
                >Change the full name linked to your account.</Text>
            </View>


        <View className="w-full mb-6 px-5">
            <Text
                className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Email</Text>
            <View
                style={{backgroundColor: "#ffffff"}}
                className="flex justify-center items-center h-14 rounded-full px-5">
                <TouchableOpacity
                    onPress={()=> openSheet("email")}
                    className="w-full flex-1 flex flex-row justify-between items-center">
                    <Text className="font-GoogleSansMedium text-base leading-5 text-secondaryGray ">{driveremail}</Text>
                    <Ionicons name="create-outline" size={18} color="gray"/>
                </TouchableOpacity>
            </View>
            <Text
                className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray  ">Edit the email address associated with your account.
            </Text>
        </View>


        <View className="w-full mb-6 px-5">
            <Text
                className="font-GoogleSansRegular text-base pl-4 leading-5 mb-1 text-secondaryBlack ">Phone Number</Text>
            <View
                style={{backgroundColor: "#ffffff"}}
                className="flex justify-center items-center h-14 rounded-full px-5">
                <TouchableOpacity
                    onPress={()=> router.push("/homepage/profile/editProfile/changePhoneNumber")}
                    className="w-full flex-1 flex flex-row justify-between items-center">
                    <Text className="font-GoogleSansMedium text-base leading-5 text-secondaryGray ">{drivernumber}</Text>
                    <Ionicons name="chevron-forward" size={18} color="gray"/>
                </TouchableOpacity>
            </View>

            <Text
                className="text-xs leading-4 pl-4 mt-2 font-GoogleSansRegular text-secondaryGray">Update the phone number linked to your account.</Text>
        </View>
    </>

            <BottomSheet
                onChange={(index) => {
                    if (index === -1) {
                        Keyboard.dismiss();
                    }
                }}
                ref={bottonSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={{
                    backgroundColor: "#ffffff",

                }}
                handleIndicatorStyle={{
                    backgroundColor: "gray",
                }}
            >
                <BottomSheetView className="p-5 flex-1">

                    {editType === "name" && (
                        <View className="w-full flex-1 flex items-center">
                            <View className="w-full py-2">
                                <Text className="text-xl leading-6 font-GoogleSansMedium tracking-tight text-secondaryBlack ">Change full name</Text>
                            </View>

                            <TextInput
                                value={fullName}
                                onChangeText={handleFullName}
                                autoCorrect={false}
                                autoCapitalize="none"
                                textContentType="name"
                                autoComplete="name"
                                keyboardType="default"
                                autoFocus={true}
                                style={{paddingLeft: 16}}
                                className="bg-general mb-1 dark:focus:border-tertiaryGray font-GoogleSansMedium text-secondaryBlack w-full h-14 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                            />

                            <View className="mb-8 w-full items-start">
                                <Text className="text-sm leading-4 font-GoogleSansRegular text-secondaryBlack ">Your full name should be at least 3 characters.</Text>

                            </View>

                            <PrimaryButton disabled={isDisabledFullName} name="Done" onPress={handleEditFullName}/>

                        </View>
                    )}

                    {editType === "email" && (
                        <>
                        <View className="w-full py-2">
                            <Text className="text-xl leading-5 font-GoogleSansMedium tracking-tight text-secondaryBlack ">What&apos;s your email?</Text>
                        </View>

                        <TextInput
                        autoCorrect={false}
                        autoCapitalize="none"
                        textContentType="emailAddress"
                        autoComplete="email"
                        value={emailAddress}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoFocus={true}
                        style={{paddingLeft: 16}}
                        className="bg-general mb-1 font-GoogleSansMedium text-secondaryBlack w-full h-14 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                />
                <View className="mb-6 w-full items-start">

                    {error ? (
                            <Text className="text-red-500 text-sm leading-4 mt-1 font-GoogleSansMedium">
                                {error}
                            </Text>
                        ) :
                        <Text className="text-sm leading-4 font-GoogleSansRegular text-secondaryBlack ">You&apos;ll need to verify this email later.</Text>
                    }
                </View>

                    <View className="w-full flex justify-center items-center">

                        <PrimaryButton name="Done" disabled={isDisabledEmail} onPress={handleEditEmail}/>
                    </View>
            </>
                    )}

                </BottomSheetView>
            </BottomSheet>

        </View>
    )
}
export default Index
