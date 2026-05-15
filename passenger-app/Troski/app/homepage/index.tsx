// @ts-ignore

import {View, Pressable, TouchableOpacity} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import SearchBarButton from "@/components/SearchBarButton";
import RollingTrips from "@/components/ui/RollingTrips";
import {useColorScheme} from "nativewind";


const Index = () => {

    const bottomSheetRef = useRef<BottomSheet>(null);
    const { colorScheme } = useColorScheme();


    const snapPoints = useMemo(() => ["35%", "50%", "100%"], []);
    const [showIndex, setShowIndex] = useState(0)

    const mapRef = useRef<MapView | null>(null);

    const [coords, setCoords] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);


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

                    if (!coords) {
                        mapRef.current?.animateToRegion(
                            {
                                latitude,
                                longitude,
                                latitudeDelta: 0.001,
                                longitudeDelta: 0.01,
                            }
                        )
                    }

                }
            );
        })();


        return () => {
            subscription?.remove();
        };
    }, []);

    const handleSearchRides = ()=>{
        router.push({
            pathname: "/homepage/bookings",
            params: {
                latitude: coords?.latitude,
                longitude: coords?.longitude,
            },
        })
    }



    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="auto" />

            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                followsUserLocation={false}
                showsUserLocation={false}
            >
                {coords && (

                    <>
                    <Marker coordinate={coords} pinColor="#ffcc00"/>


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
                <TouchableOpacity
                    onPress={() => router.push("/profile")}
                    className="bg-white dark:bg-secondaryBlack"
                    style={{
                        padding: 10,
                        borderRadius: 20,
                        elevation: 5,
                        left: 20,
                    }}
                >
                    <Ionicons name="menu" size={24} color={colorScheme === "dark"? "#ffffff" : "#000000"} />
                </TouchableOpacity>

                <Pressable
                    className="flex flex-row bg-white dark:bg-secondaryBlack justify-between items-center rounded-full"
                    style={{
                        padding: 10,
                        elevation: 5,
                        right: 20,
                        gap: 10
                    }}
                >
                    <TouchableOpacity onPress={()=>router.push("/profile/rideHistory")}>
                        <Ionicons name="bus-outline" size={22} color={colorScheme === "dark"? "#ffffff" : "#000000"}/>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=>router.push("/homepage/recentNotifications")}>
                        <Ionicons name="notifications-outline" size={24} color={colorScheme === "dark"? "#ffffff" : "#000000"}/>
                    </TouchableOpacity>

                </Pressable>
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={showIndex}
                snapPoints={snapPoints}
                enablePanDownToClose={false}
                backgroundStyle={{
                    backgroundColor: colorScheme === "dark"? "#000000" : "#ffffff",
                }}
                handleIndicatorStyle={{
                    backgroundColor: colorScheme === "dark"? "gray": "gray",
                }}

            >
                <BottomSheetView>
                    <View className="flex flex-col gap-4" style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                        <SearchBarButton name="Where are you going?" onPress={handleSearchRides}/>
                        <RollingTrips/>
                    </View>


                </BottomSheetView>
            </BottomSheet>


        </View>
    );
};

export default Index;