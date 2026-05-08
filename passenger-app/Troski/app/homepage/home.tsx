// @ts-ignore

import {View, Image, Pressable, Modal, Text, TouchableOpacity} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import SearchBarButton from "@/components/SearchBarButton";
import RollingTrips from "@/components/ui/RollingTrips";

const Home = () => {
    const bottomSheetRef = useRef<BottomSheet>(null);

    const snapPoints = useMemo(() => ["35%", "50%", "100%"], []);
    const [showIndex, setShowIndex] = useState(0)

    const mapRef = useRef<MapView | null>(null);

    const [coords, setCoords] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);

    const carColor = "#ffcc00";

    useEffect(() => {
        const timer = setTimeout(() => {
            bottomSheetRef.current?.snapToIndex(0);
        }, 50);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") return;

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 2000,
                    distanceInterval: 5,
                },
                (location) => {
                    const { latitude, longitude } = location.coords;

                    setCoords({ latitude, longitude });

                    mapRef.current?.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.001,
                        longitudeDelta: 0.01,
                    });
                }
            );
        })();

        return () => {
            subscription?.remove();
        };
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="dark" />

            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                followsUserLocation={false}
                showsUserLocation={false}
            >
                {coords && (

                    <>
                    <Marker coordinate={coords}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: carColor,
                                justifyContent: "center",
                                alignItems: "center",
                                borderWidth: 2,
                                borderColor: "black",
                            }}
                        >
                            <Image
                                source={require("../../assets/images/minibus.png")}
                                style={{
                                    width: 22,
                                    height: 22,
                                    tintColor: "black",
                                }}
                            />
                        </View>
                    </Marker>

                    <Circle
                        center={coords}
                        radius={300}
                        strokeColor="rgba(0, 122, 255, 0.5)"
                        fillColor="rgba(0, 122, 255, 0.2)"
                    />

                </>
                )}
            </MapView>

            <View
                className="w-full flex flex-row justify-between items-center"
                style={{
                    position: "absolute",
                    top: 60,

                }}
            >
                <Pressable
                    onPress={() => router.push("../profile/profileScreen")}
                    style={{
                        backgroundColor: "white",
                        padding: 10,
                        borderRadius: 20,
                        elevation: 5,
                        left: 20,
                    }}
                >
                    <Ionicons name="menu" size={24} />
                </Pressable>

                <Pressable
                    className="flex flex-row justify-between items-center rounded-full"
                    style={{
                        backgroundColor: "white",
                        padding: 10,
                        elevation: 5,
                        right: 20,
                        gap: 10
                    }}
                >
                    <TouchableOpacity onPress={()=>router.push("/profile/rideHistory")}>
                        <Ionicons name="car-outline" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=>router.push("/profile/recentNotifications")}>
                        <Ionicons name="notifications-outline" size={24} />
                    </TouchableOpacity>

                </Pressable>
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={showIndex}
                snapPoints={snapPoints}
                enablePanDownToClose={false}
                backgroundStyle={{ backgroundColor: "white" }}
            >
                <BottomSheetView>
                    <View className="flex flex-col gap-4" style={{ padding: 16 }}>
                        <SearchBarButton name="Where are you going?" onPress={()=>router.push("/bookings/searchRides")}/>
                        <RollingTrips/>
                    </View>


                </BottomSheetView>
            </BottomSheet>


        </View>
    );
};

export default Home;