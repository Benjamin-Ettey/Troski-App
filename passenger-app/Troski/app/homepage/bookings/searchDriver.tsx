import {
    View,
    Text,
    ActivityIndicator,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet, Image, Alert,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import { Ionicons } from "@expo/vector-icons";

import PrimaryButton from "@/components/PrimaryButton";

import { router } from "expo-router";

import MapView, { Marker, Polyline } from "react-native-maps";

import { useAppStore } from "@/utils/store";
// @ts-ignore
import call from 'react-native-phone-call'


import {KeyboardAwareScrollView} from "react-native-keyboard-controller";
import {useAudioPlayer} from "expo-audio";
import {useColorScheme} from "nativewind";
import LottieView from "lottie-react-native";

type Message = {
    id: string;
    text: string;
    from: "user" | "driver";
    time: number;
};

const audioSource = require("../../../assets/audio/driverarrived.mp3")


const SearchDriver = () => {
    const snapPoints = useMemo(() => ["50%"], []);
    const chatSnapPoints = useMemo(() => ["85%"], []);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const chatBottomRef = useRef<BottomSheet>(null);
    const mapRef = useRef<MapView>(null);
    const flatListRef = useRef<FlatList<Message>>(null);
    const arrivalTimeoutRef = useRef<number | null>(null);

    const [driverFound, setDriverFound] = useState(false);
    const [driverArrived, setDriverArrived] = useState(false);
    const [showModal, setShowModal] = useState(true);


    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");



    const [routeCoordsLocal, setRouteCoordsLocal] = useState<
        { latitude: number; longitude: number }[]
    >([]);



    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore((s) => s.destinationCoords);
    const pickupPoint = useAppStore((s) => s.pickupPoint);
    const destinationPoint = useAppStore((s) => s.destinationPoint);
    const routeCoordsFromStore = useAppStore((s) => s.routeCoords);
    const driverCoords = useAppStore((s) => s.driverCoords);
    const setDriverCoords = useAppStore((s) => s.setDriverCoords);
    const driverEta = useAppStore((s) => s.driverEta);
    const setDriverEta = useAppStore((s) => s.setDriverEta);
    const [showArrivedMessage, setShowArrivedMessage] = useState(false);
    const player = useAudioPlayer(audioSource);
    const { colorScheme } = useColorScheme();
    const [bookingCode] = useState(
        () => Math.floor(100000 + Math.random() * 900000)
    );

    const handleDriverCall= ()=>{
        const args = {
            number: '0503524779',
            prompt: false,
            skipCanOpen: true
        }

        call(args).catch(console.error)
    }


    useEffect(() => {
        const timer = setTimeout(() => {
            setDriverFound(true);

            if (pickupCoords) {
                setDriverCoords({
                    latitude: pickupCoords.latitude - 0.02,
                    longitude: pickupCoords.longitude - 0.02,
                });
            }
        }, 3000);

        return () => clearTimeout(timer);

    }, []);



    useEffect(() => {
        if (!driverFound) return;
        if (!driverCoords || !pickupCoords) return;
        if (driverArrived) return;


        const interval = setInterval(() => {
            setDriverCoords((prev: any) => {
                if (!prev) return prev;

                const latDiff = pickupCoords.latitude - prev.latitude;
                const lngDiff = pickupCoords.longitude - prev.longitude;

                const nextLat = prev.latitude + latDiff * 0.12;
                const nextLng = prev.longitude + lngDiff * 0.12;



                const arrived =
                    Math.abs(latDiff) < 0.0005 && Math.abs(lngDiff) < 0.0005;

                if (arrived) {
                    setDriverArrived(true);
                    setDriverEta(null);
                    setShowArrivedMessage(true);
                    
                    const timer = setTimeout(()=>{
                        player.play();
                        return()=>clearTimeout(timer);
                    }, 2000)


                    if (arrivalTimeoutRef.current) {
                        clearTimeout(arrivalTimeoutRef.current);
                    }
                    arrivalTimeoutRef.current = setTimeout(() => {

                        setShowArrivedMessage(false);
                    }, 5000);

                    return pickupCoords;
                }

                return {
                    latitude: nextLat,
                    longitude: nextLng,
                };
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [driverFound, pickupCoords, setDriverCoords, setDriverEta, driverArrived]);




    useEffect(() => {
        if (!driverCoords || !pickupCoords || driverArrived || showArrivedMessage) return;

        let mounted = true;

        const calculateEta = async () => {
            if (!mounted) return;
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${driverCoords.longitude},${driverCoords.latitude};${pickupCoords.longitude},${pickupCoords.latitude}?overview=false`;

                const res = await fetch(url);
                const data = await res.json();
                const seconds = data?.routes?.[0]?.duration;

                if (seconds && mounted) {
                    const mins = Math.max(1, Math.round(seconds / 60));
                    setDriverEta(`${mins} min away`);
                }
            } catch (err) {
                console.log(err);
            }
        };

        calculateEta();
        const etaInterval = setInterval(calculateEta, 10000);

        return () => {
            mounted = false;
            clearInterval(etaInterval);
        };
    }, [driverCoords, driverArrived, pickupCoords, setDriverEta, showArrivedMessage]);




    useEffect(() => {
        if (!driverArrived) return;
        if (!pickupCoords || !destinationCoords) return;

        let mounted = true;

        const fetchRoute = async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.longitude},${pickupCoords.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson&steps=false`;

                const res = await fetch(url);
                const data = await res.json();

                const coords: any[] = data?.routes?.[0]?.geometry?.coordinates;

                if (coords && Array.isArray(coords) && mounted) {
                    const mapped = coords.map((c: number[]) => ({
                        latitude: c[1],
                        longitude: c[0],
                    }));

                    setRouteCoordsLocal(mapped);
                }
            } catch (err) {
                console.log("Failed to fetch route:", err);
            }
        };

        fetchRoute();

        return () => {
            mounted = false;
        };
    }, [driverArrived, pickupCoords, destinationCoords]);



    useEffect(() => {
        if (!mapRef.current) return;

        if (routeCoordsLocal && routeCoordsLocal.length > 0) {
            mapRef.current.fitToCoordinates(routeCoordsLocal, {
                edgePadding: { top: 120, right: 60, bottom: 300, left: 60 },
                animated: true,
            });
            return;
        }

        if (driverFound && driverCoords && pickupCoords && destinationCoords) {
            const coords = [driverCoords, pickupCoords, destinationCoords].filter(Boolean);
            if (coords.length > 0) {
                mapRef.current.fitToCoordinates(coords as any, {
                    edgePadding: { top: 150, right: 60, bottom: 350, left: 60 },
                    animated: true,
                });
            }
            return;
        }

        if (pickupCoords) {
            mapRef.current.fitToCoordinates([pickupCoords], {
                edgePadding: { top: 150, right: 60, bottom: 350, left: 60 },
                animated: true,
            });
        }
    }, [routeCoordsLocal, driverCoords, driverFound, pickupCoords, destinationCoords]);




    const handleCancelRide = () => {
        Alert.alert(
            "Cancel ride?", "Your trip request will be cancelled and the driver will be notified.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Cancel ride",
                    style: "destructive",
                    onPress: ()=> {
                        setShowModal(false);
                        router.replace("/homepage/bookings/whyCancelRide");
                    }
                }


            ]
        )


    };


    const openChat = () => {
        setChatOpen(true);
        setTimeout(() => {
            chatBottomRef.current?.snapToIndex(0);
        }, 50);
    };

    const closeChat = () => {
        chatBottomRef.current?.close();
        setTimeout(() => setChatOpen(false), 200);
    };

    const sendMessage = () => {
        const text = inputText.trim();
        if (!text) return;

        const newMsg: Message = {
            id: `${Date.now()}`,
            text,
            from: "user",
            time: Date.now(),
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");


        setTimeout(() => {
            const reply: Message = {
                id: `${Date.now()}-r`,
                text: "Okay, on my way.",
                from: "driver",
                time: Date.now(),
            };
            setMessages((prev) => [...prev, reply]);

            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        }, 1200);


        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.from === "user";
        return (
            <View
                style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowDriver,
                ]}
            >
                <View style={[styles.bubble,
                    isUser ?
                    {backgroundColor: colorScheme === "dark"? "#ffcc00": "#0165FC",
                    borderBottomRightRadius: 4} :
                    styles.bubbleDriver]}>
                    <Text style={isUser ?
                        {
                            color: colorScheme ==="dark"? "black":"white",
                        }

                        : styles.textDriver} className="font-GoogleSansRegular">{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={showModal} animationType="slide">
            <View style={{ flex: 1 }} className="bg-general">


                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    initialRegion={{
                        latitude: pickupCoords?.latitude || 5.6037,
                        longitude: pickupCoords?.longitude || -0.1870,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >

                    {driverCoords && (
                        <Marker coordinate={driverCoords}>
                            <View
                                style={{
                                    backgroundColor: "#000000",
                                    padding: 10,
                                    borderRadius: 999,
                                }}
                            >

                                <Image
                                    source={require("../../../assets/images/minibus.png")}
                                    style={{width: 20, height: 20}}
                                    resizeMode="contain"
                                />
                            </View>
                        </Marker>
                    )}

                    {pickupCoords && <Marker coordinate={pickupCoords} pinColor="#0165FC" />}

                    {destinationCoords && (
                        <Marker coordinate={destinationCoords} pinColor="#ffcc00" />
                    )}


                    {driverFound && !driverArrived && driverCoords && pickupCoords && (
                        <Polyline
                            coordinates={[driverCoords, pickupCoords]}
                            strokeWidth={5}
                            strokeColor="#0165FC"
                            lineDashPattern={[1]}
                        />
                    )}


                    {driverArrived && routeCoordsLocal?.length > 0 && (
                        <Polyline coordinates={routeCoordsLocal} strokeWidth={6} strokeColor="#ffcc00" />
                    )}


                    {!driverArrived && driverFound && routeCoordsFromStore?.length > 0 && (
                        <Polyline coordinates={routeCoordsFromStore} strokeWidth={6} strokeColor="#ffcc00" />
                    )}
                </MapView>



                <View
                    style={{
                        position: "absolute",
                        top: 40,
                        left: 0,
                        right: 0,
                        height: 56,
                        zIndex: 20,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 12,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            paddingHorizontal: 10,
                            paddingVertical: 12,
                        }}
                        className="rounded-full bg-general dark:bg-secondaryBlack"
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                color: colorScheme === "dark"? "white":"black",
                                fontWeight: "600",
                                fontSize: 14,
                                maxWidth: "40%",
                                textAlign: "right",
                            }}
                        >
                            {pickupPoint || "Pickup"}
                        </Text>

                        <Ionicons
                            name="arrow-forward"
                            size={14}
                            color= {colorScheme === "dark"? "gray":"black"}
                            style={{
                                marginHorizontal: 8,
                            }}
                        />

                        <Text
                            numberOfLines={1}
                            style={{
                                color: colorScheme === "dark"? "#ffcc00":"black",
                                fontWeight: "600",
                                fontSize: 14,
                                maxWidth: "40%",
                                textAlign: "left",
                            }}
                        >
                            {destinationPoint || "Destination"}
                        </Text>
                    </View>
                </View>



                <BottomSheet
                    ref={bottomSheetRef}
                    snapPoints={snapPoints}
                    index={0}
                    backgroundStyle={{
                        backgroundColor: colorScheme === "dark"? "#000000" : "#ffffff",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                    handleIndicatorStyle={{
                        backgroundColor: colorScheme === "dark"? "gray": "gray",
                    }}
                    onChange={(index) => {
                        if (index < 1) {
                            bottomSheetRef.current?.snapToIndex(1);
                        }
                    }}
                >
                    <BottomSheetView style={{ flex: 1 }}>
                        <View style={{ marginTop: "5%" }} className="w-full flex justify-center items-center">
                            {driverFound ? (
                                <View className="w-full flex items-center" style={{ paddingHorizontal: 4 }}>

                                    <View
                                        style={{
                                            paddingHorizontal: 16,
                                        }}
                                        className="rounded-3xl gap-4 flex flex-row justify-center items-center w-full"
                                    >

                                        <View
                                            style={{width: 50, height: 50, padding: 10, backgroundColor: "#ffcc0033" }}
                                            className="flex justify-center items-center rounded-full border-2 border-primary"
                                        >
                                            <Ionicons name="person" color="#ffcc00" size={24} />
                                        </View>



                                        <View  className="flex-1 flex flex-col justify-start">
                                            <Text numberOfLines={1} className="font-GoogleSansMedium dark:text-general">Kelvin Agyeman</Text>

                                            <View style={{gap: 4}} className="flex flex-row justify-start items-center">
                                                <>
                                                    <Ionicons name="star" size={12} color="#ffcc00"/>
                                                    <Text className="font-GoogleSansRegular text-xs dark:text-tertiaryGray">4.9</Text>
                                                </>
                                                <Text className="font-GoogleSansRegular text-xs dark:text-tertiaryGray">{'\u2022'}</Text>
                                                <>
                                                    <Text className="font-GoogleSansRegular text-xs dark:text-tertiaryGray">(100trips)</Text>
                                                </>
                                            </View>

                                        </View>

                                        <View className="flex flex-row justify-center items-center" style={{gap: 10}}>
                                            <TouchableOpacity
                                                className="rounded-full bg-tertiaryWhite  dark:bg-secondaryBlack" style={{padding: 10}}
                                                onPress={openChat}
                                            >
                                                <Ionicons name="chatbubbles-outline" size={24} color={colorScheme === "dark"? "white":"black"}/>

                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={handleDriverCall}
                                                className="rounded-full " style={{padding: 10, backgroundColor: "#34C759"}}
                                            >
                                                <Ionicons name="call-outline" size={24} color="white"/>

                                            </TouchableOpacity>
                                        </View>

                                    </View>




                                    <View style={{ paddingHorizontal: 16 }} className="w-full">
                                        <View style={{marginBottom: 10, marginTop: 10}} className="w-full flex flex-row justify-center items-center">
                                            {(driverEta || showArrivedMessage) && (
                                                <View
                                                    style={{ gap: 5 }}
                                                    className="flex flex-row justify-center items-center"
                                                >
                                                    <Ionicons
                                                        name={showArrivedMessage ? "checkmark-circle" : "person-outline"}
                                                        size={12}
                                                        color={showArrivedMessage ? "#22C55E" : "red"}
                                                    />

                                                    <Text
                                                        className="font-GoogleSansMedium"
                                                        style={{
                                                            color: showArrivedMessage ? "#22C55E" : "red",
                                                        }}
                                                    >
                                                        {showArrivedMessage
                                                            ? "Driver arrived"
                                                            : `Your driver is ${driverEta}`}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>


                                        <View style={{marginBottom: 16}} className="w-full flex flex-row justify-between items-center">
                                            <View style={{gap: 5}} className="flex flex-row justify-start items-center">
                                                <Ionicons name="bus-outline" size={12} color={colorScheme === "dark"? "white" : "black"}/>
                                                <Text numberOfLines={1} className="font-GoogleSansMedium text-sm dark:text-tertiaryGray">Sprinter Benz - White</Text>
                                            </View>

                                            <View style={{gap: 5}} className="flex flex-row justify-start items-center">
                                                <Ionicons name="reader-outline" size={12} color={colorScheme === "dark"? "white" : "black"}/>
                                                <Text numberOfLines={1} className="font-GoogleSansRegular text-sm dark:text-general">Plate:</Text>
                                                <Text numberOfLines={1} className="font-GoogleSansMedium text-sm dark:text-tertiaryGray">XYZ 123 ZZ</Text>
                                            </View>
                                        </View>

                                        <View style={{height: 1, marginBottom: 16}} className="bg-tertiaryWhite w-full dark:bg-tertiaryGray"/>
                                        <>
                                            <Text  className="font-GoogleSansMedium flex-shrink dark:text-general">
                                                Booking code
                                            </Text>
                                            <Text style={{ marginBottom: 12 }} className="font-GoogleSansRegular text-xs flex-shrink dark:text-tertiaryGray">
                                                Share this code with the driver for verification
                                            </Text>

                                            <TouchableOpacity
                                                style={{
                                                    paddingVertical: 16,
                                                }}
                                                className="rounded-xl gap-4 border-2 border-dashed border-primary flex justify-center items-center bg-primary/20 w-full"
                                            >
                                                <Text className="font-GoogleSansBold dark:text-general" style={{ fontSize: 32, letterSpacing: 4 }}>
                                                    {bookingCode}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    </View>
                                </View>
                            ) : (
                                <View className="flex-1 justify-center items-center">

                                    <View className="justify-center items-center">

                                        <LottieView
                                            source={require("../../../assets/video/loadingdots.json")}
                                            autoPlay
                                            loop
                                            style={{
                                                width: 300,
                                                height: 300,
                                            }}
                                        />

                                        <View className="absolute bottom-10">
                                            <Text className="font-GoogleSansRegular dark:text-tertiaryGray text-center">
                                                Searching for a driver. Please be patient...
                                            </Text>
                                        </View>

                                    </View>

                                </View>
                            )}
                        </View>
                    </BottomSheetView>
                </BottomSheet>



                {driverFound && (
                    <View style={{ bottom: 32 }} className="absolute w-full flex items-center">
                        <View className="w-full flex justify-center items-center">
                            <PrimaryButton name="Cancel Ride" disabled={false} onPress={handleCancelRide} />
                        </View>
                    </View>
                )}

                {chatOpen && (
                    <BottomSheet
                        ref={chatBottomRef}
                        index={0}
                        snapPoints={chatSnapPoints}
                        enablePanDownToClose
                        backgroundStyle={{
                            backgroundColor: colorScheme === "dark"? "#000000" : "#ffffff",

                        }}
                        handleIndicatorStyle={{
                            backgroundColor: colorScheme === "dark"? "gray": "gray",
                        }}
                        onClose={() => setChatOpen(false)}
                    >
                        <BottomSheetView style={{ flex: 1 }}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : undefined}
                                style={{ flex: 1 }}
                                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
                            >
                                <KeyboardAwareScrollView
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{flex: 1}}
                                >
                                    <View style={{ padding: 16, flex: 1 }}>
                                        <View className="flex flex-row justify-between items-center" style={{ marginBottom: 12, gap: 10 }}>
                                            <View
                                                style={{width: 42, height: 42, padding: 10, backgroundColor: "#ffcc0033" }}
                                                className="flex justify-center items-center rounded-full border-2 border-primary"
                                            >
                                                <Ionicons name="person" color="#ffcc00" size={16} />
                                            </View>

                                            <View  className="flex-1 flex flex-col justify-start">
                                                <Text numberOfLines={1} className="font-GoogleSansMedium dark:text-general">Kelvin Agyeman</Text>

                                            </View>

                                            <TouchableOpacity style={{padding: 5}} className="rounded-full bg-tertiaryWhite dark:bg-secondaryBlack" onPress={closeChat}>
                                                <Ionicons name="close" size={24} color={colorScheme === "dark"? "#ffffff":"#333"} />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <FlatList
                                                scrollEnabled={false}
                                                nestedScrollEnabled={true}
                                                ref={flatListRef}
                                                data={messages}
                                                keyExtractor={(item) => item.id}
                                                renderItem={renderMessage}
                                                contentContainerStyle={{ paddingBottom: 12 }}
                                                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                            />
                                        </View>

                                        <View style={{
                                            flexDirection: "row",
                                            alignItems: "flex-end",
                                            paddingTop: 8,
                                            borderTopWidth: 1,
                                            borderTopColor: colorScheme === "dark"? "#0a0a0a":"#eee",
                                        }}>
                                            <TextInput
                                                className="font-GoogleSansRegular dark:text-general"
                                                value={inputText}
                                                onChangeText={setInputText}
                                                placeholderTextColor={colorScheme === "dark"? "#f0f0f0":"#e4e4e4"}
                                                placeholder="Type a message..."
                                                style={{
                                                    flex: 1,
                                                    minHeight: 40,
                                                    maxHeight: 120,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    backgroundColor: colorScheme === "dark"? "black":"white",
                                                    borderRadius: 24,
                                                    marginRight: 8,
                                                    borderWidth: 1,
                                                    borderColor: "#e6e6e6",}}
                                                multiline
                                                returnKeyType="send"
                                                onSubmitEditing={() => {
                                                    if (!Platform.OS || Platform.OS === "android") {
                                                        sendMessage();
                                                    }
                                                }}
                                            />

                                            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                                                <Ionicons name="send" size={20} color={colorScheme === "dark"? "black":"white"} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </KeyboardAwareScrollView>
                            </KeyboardAvoidingView>
                        </BottomSheetView>
                    </BottomSheet>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    messageRow: {
        marginVertical: 6,
        paddingHorizontal: 8,
        flexDirection: "row",
    },
    messageRowUser: {
        justifyContent: "flex-end",
    },
    messageRowDriver: {
        justifyContent: "flex-start",
    },
    bubble: {
        maxWidth: "80%",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
    },

    bubbleDriver: {
        backgroundColor: "#f1f1f1",
        borderBottomLeftRadius: 4,
    },
    textUser: {
        fontSize: 14,
    },
    textDriver: {
        color: "#111",
        fontSize: 14,
    },


    sendButton: {
        backgroundColor: "#ffcc00",
        width: 40,
        height: 40,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default SearchDriver;