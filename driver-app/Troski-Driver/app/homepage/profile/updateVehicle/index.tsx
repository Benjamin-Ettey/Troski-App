import {View, Text, TouchableOpacity, Image, Modal, ActivityIndicator} from 'react-native'
import React, {useState} from 'react'
import {KeyboardAwareScrollView, KeyboardToolbar} from "react-native-keyboard-controller";
import {StatusBar} from "expo-status-bar";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import VerificationInput from "@/components/VerificationInput";
import {useAppStore} from "@/utils/store";
import * as ImagePicker from "expo-image-picker";
import DisabledPrimaryButton from "@/components/DisabledPrimaryButton";
import PrimaryButton from "@/components/PrimaryButton";
import LottieView from "lottie-react-native";
import {Dropdown} from "react-native-element-dropdown";

const Index = () => {

    const router = useRouter();
    const vehiclePlateRegex = /^[A-Z]{1,3}\s?\d{1,4}[- ]?\d{2}$/i;

    const newvehicletype = useAppStore((state) => state.newvehicletype);
    const newvehiclenumberplate = useAppStore((state) => state.newvehiclenumberplate);
    const newvehiclecolor = useAppStore((state) => state.newvehiclecolor);
    const newvehiclecapacity = useAppStore((state) => state.newvehiclecapacity);
    const newvehiclephoto = useAppStore((state) => state.newvehiclephoto);

    const setNewVehicleType = useAppStore((state) => state.setNewVehicleType);
    const setNewVehicleNumberPlate = useAppStore((state) => state.setNewVehicleNumberPlate);
    const setNewVehicleColor = useAppStore((state) => state.setNewVehicleColor);
    const setNewVehicleCapacity = useAppStore((state) => state.setNewVehicleCapacity);
    const setNewVehiclePhoto = useAppStore((state) => state.setNewVehiclePhoto);

    const [showLoading, setShowLoading] = useState(false);
    const [selectedUpdates, setSelectedUpdates] = useState<string[]>([]);
    const [uploadingNewVehicle, setUploadingNewVehicle] = useState(false);


    const updateOptions = [
        {label: "All", value: "all"},
        {label: "Vehicle type", value: "type"},
        {label: "Vehicle number plate", value: "plate"},
        {label: "Vehicle color", value: "color"},
        {label: "Vehicle capacity", value: "capacity"},
        {label: "Vehicle photo", value: "photo"},
    ];

    const handleVehiclePhoto = async () => {

        try {
            setUploadingNewVehicle(true);

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
                setNewVehiclePhoto(result.assets[0].uri)
            }

        }catch (error){
            console.log(error);
        }finally {
            setUploadingNewVehicle(false)
        }


    };

    const isAll = selectedUpdates.includes("all") || selectedUpdates.length === 0;

    const isDisabled = isAll
        ? (
            !newvehicletype ||
            newvehicletype.trim().length < 2 ||
            !vehiclePlateRegex.test(newvehiclenumberplate.trim()) ||
            !newvehiclecolor ||
            newvehiclecolor.trim().length < 2 ||
            !newvehiclecapacity ||
            Number(newvehiclecapacity) <= 0 ||
            !newvehiclephoto
        )
        : (
            (selectedUpdates.includes("type") && (!newvehicletype || newvehicletype.trim().length < 2)) ||
            (selectedUpdates.includes("plate") && !vehiclePlateRegex.test(newvehiclenumberplate.trim())) ||
            (selectedUpdates.includes("color") && (!newvehiclecolor || newvehiclecolor.trim().length < 2)) ||
            (selectedUpdates.includes("capacity") && (!newvehiclecapacity || Number(newvehiclecapacity) <= 0)) ||
            (selectedUpdates.includes("photo") && !newvehiclephoto)
        );

    const handleUpdateVehicleDetails = () => {
        setShowLoading(true);
        setTimeout(() => {
            setShowLoading(false);
            router.replace("/");
        }, 3000);
    }

    return (
        <View className="flex-1 bg-general">
            <KeyboardAwareScrollView
                bottomOffset={200}
                contentContainerStyle={{paddingBottom: 100}}
                keyboardShouldPersistTaps="handled"
                className="flex-1"
            >
                <StatusBar style="dark"/>

                <View className="w-full flex-1 flex items-center px-6">

                    <View className="w-full py-6 flex-col gap-2">
                        <Text className="text-3xl leading-tight tracking-tighter text-secondaryBlack font-GoogleSansMedium">
                            Request vehicle update
                        </Text>
                        <Text className="text-sm leading-tight text-secondaryGray font-GoogleSansRegular">
                            Please provide a few details about your updated vehicle so we can review and approve the changes.
                        </Text>
                        <Text className="text-sm leading-tight text-red-600 font-GoogleSansMedium">
                            NB: You&apos;ll be temporarily logged out while we verify the changes and can log back in once your vehicle is approved.
                        </Text>
                    </View>

                    <View className="w-full flex flex-col justify-center items-start gap-6 pt-8">

                        <View className="w-full gap-2">
                            <View className="w-full flex flex-row items-center gap-2">
                                <Text
                                    style={{paddingLeft: 8}}
                                    className="text-base leading-tight tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                    Select one or more details to update
                                </Text>
                            </View>

                            <Dropdown
                                style={{
                                    height: 56,
                                    borderWidth: 1,
                                    borderColor: "#a9a9a9",
                                    borderRadius: 16,
                                    paddingHorizontal: 16,
                                    backgroundColor: "white",
                                }}
                                placeholderStyle={{
                                    fontSize: 16,
                                    color: "#a9a9a9",
                                }}
                                selectedTextStyle={{
                                    fontSize: 16,
                                    color: "#a9a9a9",
                                }}
                                data={updateOptions}
                                labelField="label"
                                valueField="value"
                                value={selectedUpdates}
                                placeholder="Select an option"
                                onChange={(item) => {
                                    if (item.value === "all") {
                                        setSelectedUpdates(["all"]);
                                        return;
                                    }
                                    setSelectedUpdates(prev => {
                                        const withoutAll = prev.filter(v => v !== "all");
                                        if (withoutAll.includes(item.value)) {
                                            return withoutAll;
                                        }
                                        return [...withoutAll, item.value];
                                    });
                                }}
                            />
                        </View>

                        <View className="w-full flex-row flex-wrap gap-2 mt-2">
                            {selectedUpdates.map((item) => {
                                const label = updateOptions.find(option => option.value === item)?.label;
                                return (
                                    <View
                                        key={item}
                                        className="flex-row items-center bg-yellow-100 px-3 py-2 rounded-full"
                                    >
                                        <Text className="font-GoogleSansMedium text-base leading-tight">
                                            {label}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() =>
                                                setSelectedUpdates(prev =>
                                                    prev.filter(value => value !== item)
                                                )
                                            }
                                        >
                                            <Ionicons
                                                name="close-circle"
                                                size={18}
                                                color="black"
                                                style={{marginLeft: 6}}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>

                        {(selectedUpdates.includes("all") || selectedUpdates.includes("type")) ? (
                            <View className="w-full gap-2">
                                <View className="w-full flex flex-row items-center gap-2">
                                    <Text
                                        style={{paddingLeft: 8}}
                                        className="text-base leading-tight tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                        Vehicle type
                                    </Text>
                                    <Ionicons name="star" size={6} color="red"/>
                                </View>
                                <VerificationInput
                                    value={newvehicletype}
                                    onChangeText={setNewVehicleType}
                                    autoFocus={true}
                                    placeholder="Enter vehicle type"
                                    autoComplete={false}
                                />
                            </View>
                        )
                            : null
                        }

                        {(selectedUpdates.includes("all") || selectedUpdates.includes("plate")) ? (
                            <View className="w-full gap-2">
                                <View className="w-full flex flex-row items-center gap-2">
                                    <Text
                                        style={{paddingLeft: 8}}
                                        className="text-base leading-tight tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                        Vehicle number plate
                                    </Text>
                                    <Ionicons name="star" size={6} color="red"/>
                                </View>
                                <VerificationInput
                                    value={newvehiclenumberplate}
                                    onChangeText={setNewVehicleNumberPlate}
                                    placeholder="Enter vehicle number plate"
                                    autoComplete={false}
                                    error={
                                        newvehiclenumberplate.length > 0 &&
                                        !vehiclePlateRegex.test(newvehiclenumberplate.trim())
                                            ? "Please enter a valid Ghana vehicle number plate"
                                            : ""
                                    }
                                />
                            </View>
                        )
                        : null
                        }

                        {(selectedUpdates.includes("all") || selectedUpdates.includes("color")) ? (
                            <View className="w-full gap-2">
                                <View className="w-full flex flex-row items-center gap-2">
                                    <Text
                                        style={{paddingLeft: 8}}
                                        className="text-base leading-tight tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                        Vehicle color
                                    </Text>
                                    <Ionicons name="star" size={6} color="red"/>
                                </View>
                                <VerificationInput
                                    value={newvehiclecolor}
                                    onChangeText={setNewVehicleColor}
                                    autoComplete={false}
                                    placeholder="Enter vehicle color"
                                />
                            </View>
                        )
                        : null}

                        {(selectedUpdates.includes("all") || selectedUpdates.includes("capacity"))? (
                            <View className="w-full gap-2">
                                <View className="w-full flex flex-row items-center gap-2">
                                    <Text
                                        style={{paddingLeft: 8}}
                                        className="text-base leading-tight tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                        Vehicle capacity
                                    </Text>
                                    <Ionicons name="star" size={6} color="red"/>
                                </View>
                                <VerificationInput
                                    value={newvehiclecapacity}
                                    onChangeText={setNewVehicleCapacity}
                                    placeholder="Enter vehicle capacity"
                                    autoComplete={false}
                                    keyboardType="number-pad"
                                />
                            </View>
                        ): null}

                        {(selectedUpdates.includes("all") || selectedUpdates.includes("photo")) ? (
                            <View className="w-full gap-2">
                                <View className="w-full flex flex-row items-center gap-2">
                                    <Text
                                        style={{paddingLeft: 8}}
                                        className="text-base leading-tight tracking-tight text-secondaryBlack font-GoogleSansMedium">
                                        Vehicle photo
                                    </Text>
                                    <Ionicons name="star" size={6} color="red"/>
                                </View>

                                {newvehiclephoto ? (
                                    <View className="border-2 border-dashed border-secondaryBlack w-28 h-28 justify-center items-center p-2 rounded-2xl">
                                        <TouchableOpacity
                                            className="w-24 h-24 rounded-2xl bg-tertiaryWhite"
                                            onPress={handleVehiclePhoto}
                                        >
                                            <Image
                                                source={{uri: newvehiclephoto}}
                                                className="w-full h-full rounded-2xl"
                                                resizeMode="cover"
                                            />
                                            <View className="absolute bottom-1 right-1">
                                                {uploadingNewVehicle?
                                                    <ActivityIndicator size="small" color="#000"/>
                                                    :
                                                    <Ionicons name="create" size={24} color="black"/>

                                                }
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="border-2 border-dashed border-secondaryBlack/50 w-28 h-28 justify-center items-center p-2 rounded-2xl">
                                        <TouchableOpacity
                                            className="w-24 h-24 rounded-2xl bg-tertiaryWhite items-center justify-center"
                                            onPress={handleVehiclePhoto}
                                        >
                                            {uploadingNewVehicle?
                                                <ActivityIndicator size="small" color="#ffcc00"/>
                                                :
                                                <Ionicons name="add-circle" size={32} color="#ffcc00"/>

                                            }
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ): null}

                        <View className="w-full flex justify-center mt-4 gap-2 items-center">
                            {isDisabled ?
                                <DisabledPrimaryButton
                                    name="Request vehicle update"
                                />
                                :
                                <PrimaryButton
                                    name="Request vehicle update"
                                    onPress={handleUpdateVehicleDetails}
                                    disabled={isDisabled}
                                />
                            }
                        </View>

                    </View>

                </View>

            </KeyboardAwareScrollView>
            <KeyboardToolbar/>

            <Modal visible={showLoading} animationType="fade">
                <View className="flex-1 flex-col gap-3 px-4 w-full justify-center items-center bg-general">
                    <LottieView
                        source={require("../../../../assets/video/loading.json")}
                        autoPlay
                        loop
                        style={{
                            width: 300,
                            height: 300,
                        }}
                    />

                </View>
            </Modal>

        </View>
    )
}

export default Index