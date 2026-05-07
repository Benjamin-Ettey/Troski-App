import {View, Text, TouchableOpacity, TextInput, Keyboard, Image, Alert} from 'react-native'
import React, {useMemo, useRef, useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useAppStore} from "@/utils/store";
import {router} from "expo-router";
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from "@gorhom/bottom-sheet";
import PrimaryButton from "@/components/PrimaryButton";


const EditProfile = () => {
    const email = useAppStore((state)=>state.email);
    const name =  useAppStore((state)=> state.name);
    const number =  useAppStore((state)=> state.number);
    const myimage = useAppStore((state) => state.image);
    const setName = useAppStore((state)=>state.setName);
    const setImage = useAppStore((state) => state.setImage);


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
                    onPress: ()=> setImage(null)

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

        setName(fullName)
        router.replace("/profile/editProfile");
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
    const setEmail = useAppStore((state) => state.setEmail);
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

        setEmail(emailAddress.trim());
        router.replace("/profile/editProfile");
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





    return (
        <View style={{backgroundColor: "#F5F7FA", flex: 1}}>

                <>
                    <View style={{height: "30%", marginBottom: 10}} className="w-full flex justify-center items-center">
                        <View>
                            {myimage ? (
                                <View className="w-full flex justify-center items-center">
                                    <Image

                                        source={{ uri: myimage }}
                                        style={{ width: 180, height: 180, borderRadius: 999, borderWidth: 3, borderColor: "#ffcc00" }}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity onPress={handleDeleteImage} style={{width: 48, height: 48, backgroundColor: "#ffffff", marginTop: 100, marginLeft: 150, position: "absolute"}}
                                          className="flex justify-center items-center rounded-full shadow-lg shadow-black/10">
                                        <Ionicons name="trash-bin-outline" size={32} color="red"/>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View
                                    style={{width: 180, height: 180, padding: 10, backgroundColor: "#ffcc0033" }}
                                    className="flex justify-center items-center rounded-full border-2 border-primary"
                                >
                                    <Ionicons name="person" color="#ffcc00" size={100} />
                                </View>
                            )}
                        </View>

                    </View>

                 <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                    <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Name</Text>
                    <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex justify-center items-center">
                        <TouchableOpacity style={{ flex:1}} onPress={()=>openSheet("name")} className="w-full flex flex-row justify-between items-center">
                            <Text className="font-GoogleSansMedium text-secondaryGray">{name}</Text>
                            <Ionicons style={{paddingRight: 16}} name="create-outline" size={18} color="gray"/>
                        </TouchableOpacity>
                 </View>
                <Text
                    style={{paddingLeft: 10, marginTop: 5}}
                    className="text-xs font-GoogleSansRegular"
                >Change the full name linked to your account.</Text>
            </View>


        <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
            <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Email</Text>
            <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex justify-center items-center">
                <TouchableOpacity style={{ flex:1}} onPress={()=> openSheet("email")} className="w-full flex flex-row justify-between items-center">
                    <Text className="font-GoogleSansMedium text-secondaryGray">{email}</Text>
                    <Ionicons style={{paddingRight: 16}} name="create-outline" size={18} color="gray"/>
                </TouchableOpacity>
            </View>
            <Text
                style={{paddingLeft: 10, marginTop: 5}}
                className="text-xs font-GoogleSansRegular">Edit the email address associated with your account.
            </Text>
        </View>


        <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
            <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Phone Number</Text>
            <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex justify-center items-center">
                <TouchableOpacity style={{ flex:1}} onPress={()=> router.push("/profile/changeNumberInfo")} className="w-full flex flex-row justify-between items-center">
                    <Text className="font-GoogleSansMedium text-secondaryGray">{number}</Text>
                    <Ionicons style={{paddingRight: 16}} name="chevron-forward" size={18} color="gray"/>
                </TouchableOpacity>
            </View>

            <Text
                style={{paddingLeft: 10, marginTop: 5}}
                className="text-xs font-GoogleSansRegular">Update the phone number linked to your account.</Text>
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
            >
                <BottomSheetView style={{ padding: 16, flex: 1 }}>

                    {editType === "name" && (
                        <View className="w-full flex-1 flex items-center">
                            <View className="w-full">
                                <Text className="text-xl font-GoogleSansMedium tracking-tight">Change full name</Text>
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
                                className="mb-1 font-GoogleSansMedium text-secondaryBlack w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                            />

                            <View className="mb-8 w-full items-start">
                                <Text className="text-sm font-GoogleSansRegular">Your full name should be at least 3 characters.</Text>

                            </View>

                            <PrimaryButton disabled={isDisabledFullName} name="Done" onPress={handleEditFullName}/>

                        </View>
                    )}

                    {editType === "email" && (
                        <>
                        <View className="w-full">
                            <Text className="text-xl font-GoogleSansMedium tracking-tight">What&apos;s your email?</Text>
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
                        className="bg-general mb-1 font-GoogleSansMedium text-secondaryBlack w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                />
                <View className="mb-6 w-full items-start">

                    {error ? (
                            <Text className="text-red-500 text-sm mt-1 font-GoogleSansMedium">
                                {error}
                            </Text>
                        ) :
                        <Text className="text-sm font-GoogleSansRegular">You&apos;ll need to verify this email later.</Text>
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
export default EditProfile
