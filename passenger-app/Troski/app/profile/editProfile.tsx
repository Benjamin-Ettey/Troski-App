import {View, Text, TouchableOpacity, Modal, TextInput} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";
import {useAppStore} from "@/utils/store";
import PrimaryButton from "@/components/PrimaryButton";
import {router} from "expo-router";

const EditProfile = () => {
    const email = useAppStore((state)=>state.email);
    const name =  useAppStore((state)=> state.name);
    const number =  useAppStore((state)=> state.number);
    const myimage =  useAppStore((state)=> state.image);


    const [showNamePop, setShowNamePop] = useState(false);
    const [showProfile, setShowProfile] = useState(true)

    const handleNameChange = () => {
        setShowNamePop(true)
        setShowProfile(false)
    }


    return (
        <View style={{backgroundColor: "#F5F7FA", flex: 1}}>

            {showProfile &&
                <>
                    <View style={{height: "30%", marginBottom: 10}} className="w-full flex justify-center items-center">
                        <TouchableOpacity style={{padding: 24, backgroundColor: "#ffcc0033"}} className="rounded-full border-2 border-primary">
                            <Ionicons name="person" size={100} color="#ffcc00"/>
                        </TouchableOpacity>
                    </View>

                    <View style={{paddingHorizontal: 16, marginBottom: 20}} className="w-full">
                <Text style={{fontSize: 16, paddingLeft: 10, marginBottom: 5}} className="font-GoogleSansRegular">Name</Text>
                <View style={{borderRadius: 24, height: 48, paddingLeft: 24}} className="bg-general flex justify-center items-center">
                    <TouchableOpacity onPress={handleNameChange} className="w-full flex flex-row justify-between items-center">
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
                <TouchableOpacity className="w-full flex flex-row justify-between items-center">
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
                <TouchableOpacity className="w-full flex flex-row justify-between items-center">
                    <Text className="font-GoogleSansMedium text-secondaryGray">{number}</Text>
                    <Ionicons style={{paddingRight: 16}} name="chevron-forward" size={18} color="gray"/>
                </TouchableOpacity>
            </View>

            <Text
                style={{paddingLeft: 10, marginTop: 5}}
                className="text-xs font-GoogleSansRegular">Update the phone number linked to your account.</Text>
        </View>
    </>
}


            {showNamePop &&
                <View
                    style={{bottom: 0, borderTopLeftRadius: 36, borderTopRightRadius: 36, height: "100%", paddingHorizontal: 16, paddingVertical: 16}}
                    className="absolute w-full bg-general shadow-2xl shadow-tertiaryGray">

                    <View style={{marginBottom: "10%"}} className="w-full flex justify-start items-center flex-row ">
                        <TouchableOpacity style={{padding: 5}} className="bg-general rounded-full shadow-2xl ">
                            <Ionicons name="close" size={32} color="black" className="ml-auto"/>
                        </TouchableOpacity>
                    </View>
                    <Text className="font-GoogleSansRegular">
                        Edit Full Name
                    </Text>
                    <TextInput
                        autoCorrect={false}
                        autoFocus={true}
                        autoCapitalize="none"
                        textContentType="name"
                        autoComplete="name"
                        keyboardType="default"
                        style={{paddingLeft: 16, marginBottom: 16}}
                        className="bg-general mb-1 font-GoogleSansMedium text-secondaryBlack w-full py-4 border border-tertiaryGray  rounded-xl focus:border focus:border-green-600/40"

                    />

                    <View className="w-full flex justify-center items-center">
                        <PrimaryButton disabled={false} name="Save" onPress={()=>router.push("/profile/editProfile")}/>
                    </View>

                </View>

            }
        </View>
    )
}
export default EditProfile
