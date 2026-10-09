import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";

import PrimaryButton from "@/components/PrimaryButton";
import { useAppStore } from "@/utils/store";

const GHANA_BOUNDS = {
    minLat: 4.5,
    maxLat: 11.2,
    minLon: -3.3,
    maxLon: 1.2,
};

const clampToGhana = (lat: number, lon: number) => {
    const clampedLat = Math.max(GHANA_BOUNDS.minLat, Math.min(GHANA_BOUNDS.maxLat, lat));
    const clampedLon = Math.max(GHANA_BOUNDS.minLon, Math.min(GHANA_BOUNDS.maxLon, lon));
    return { latitude: clampedLat, longitude: clampedLon };
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c).toFixed(1);
};

const decodePolyline = (t: string) => {
    let points: any[] = [];
    let index = 0,
        lat = 0,
        lng = 0;

    while (index < t.length) {
        let b,
            shift = 0,
            result = 0;

        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        let dlat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        let dlng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return points;
};

const SelectRide = () => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const mapRef = useRef<MapView>(null);
    const { colorScheme } = useColorScheme();

    // Store state
    const paymentMethods = useAppStore((s) => s.paymentMethods);
    const pickupCoordsRaw = useAppStore((s) => s.pickupCoords);
    const destinationCoordsRaw = useAppStore((s) => s.destinationCoords);
    const tripPrice = useAppStore((s) => s.tripPrice);
    const pickupPoint = useAppStore((s) => s.pickupPoint);
    const destinationPoint = useAppStore((s) => s.destinationPoint);
    const maxPassengersFromStore = useAppStore((s: any) => s.selectedRideMaxPassengers ?? null);


    const pickupCoords = pickupCoordsRaw
        ? clampToGhana(pickupCoordsRaw.latitude, pickupCoordsRaw.longitude)
        : null;

    const destinationCoords = destinationCoordsRaw
        ? clampToGhana(destinationCoordsRaw.latitude, destinationCoordsRaw.longitude)
        : null;

    // Local State
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [passengerCount, setPassengerCount] = useState<number>(1);
    const [isProcessingPassengers, setIsProcessingPassengers] = useState<boolean>(false);

    const maxPassengers = typeof maxPassengersFromStore === "number" ? maxPassengersFromStore : 8;

    // Helper functions for price parsing & formatting
    const extractNumericFromString = (s: any): { value: number; decimals: number } | null => {
        if (typeof s === "number" && !isNaN(s)) return { value: s, decimals: 0 };
        if (typeof s !== "string") return null;
        const match = s.match(/-?\d+(\.\d+)?/);
        if (!match) return null;
        const numStr = match[0];
        const value = parseFloat(numStr);
        const decimals = (numStr.split(".")[1] || "").length;
        if (isNaN(value)) return null;
        return { value, decimals };
    };

    const formatLikeOriginal = (original: any, numericValue: number, decimalsFallback = 2) => {
        if (typeof original === "number") {
            return `GH₵${numericValue.toFixed(decimalsFallback)}`;
        }
        if (typeof original === "string") {
            const match = original.match(/-?\d+(\.\d+)?/);
            const decimals = match && match[1] ? match[1].length - 1 : decimalsFallback;
            const formatted = numericValue.toFixed(decimals);
            if (match) {
                return original.replace(match[0], formatted);
            }
            return `GH₵${formatted}`;
        }
        return `GH₵${numericValue.toFixed(2)}`;
    };

    // Calculate Base Fare
    const calculatedKm = pickupCoords && destinationCoords
        ? Number(haversineKm(pickupCoords.latitude, pickupCoords.longitude, destinationCoords.latitude, destinationCoords.longitude))
        : 0;

    const parsed = extractNumericFromString(tripPrice);
    const baseFareNumeric = parsed ? parsed.value : (typeof tripPrice === "number" ? tripPrice : calculatedKm * 3);
    const baseFareDecimals = parsed ? parsed.decimals : 2;

    const formattedPrice = formatLikeOriginal(tripPrice, baseFareNumeric * passengerCount, baseFareDecimals);

    // Passenger counter handler
    const changePassengerCount = (delta: number) => {
        if (isProcessingPassengers) return;
        setIsProcessingPassengers(true);

        setPassengerCount((prev) => Math.max(1, Math.min(maxPassengers, prev + delta)));

        setTimeout(() => setIsProcessingPassengers(false), 80);
    };

    // Fit map view to bounds
    const animateToBounds = () => {
        if (!mapRef.current || !pickupCoords || !destinationCoords) return;

        mapRef.current.fitToCoordinates([pickupCoords, destinationCoords], {
            edgePadding: {
                top: 80,
                right: 80,
                bottom: 380,
                left: 80,
            },
            animated: true,
        });
    };

    // Route calculation logic
    useEffect(() => {
        const getRoute = async () => {
            if (!pickupCoords || !destinationCoords) {
                setRouteCoords([]);
                return;
            }

            try {
                const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

                if (GOOGLE_KEY && GOOGLE_KEY.length > 0) {
                    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupCoords.latitude},${pickupCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&key=${GOOGLE_KEY}`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (data.routes?.[0]?.overview_polyline?.points) {
                        const decoded = decodePolyline(data.routes[0].overview_polyline.points);
                        setRouteCoords(decoded.filter((p) => p && typeof p.latitude === "number"));
                    }
                } else {
                    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.longitude},${pickupCoords.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=polyline&steps=false`;
                    const res = await fetch(osrmUrl);
                    const data = await res.json();

                    if (data.routes?.[0]?.geometry) {
                        const decoded = decodePolyline(data.routes[0].geometry);
                        setRouteCoords(decoded.filter((p) => p && typeof p.latitude === "number"));
                    }
                }

                requestAnimationFrame(() => animateToBounds());
            } catch (err) {
                console.log("Route fetch error:", err);
                setRouteCoords([]);
            }
        };

        getRoute();
    }, [pickupCoordsRaw, destinationCoordsRaw]);

    return (
        <View style={{ flex: 1 }} className="w-full bg-general dark:bg-black">
            {/* MAP VIEW */}
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: pickupCoords?.latitude || 7.9465,
                    longitude: pickupCoords?.longitude || -1.0232,
                    latitudeDelta: 6.5,
                    longitudeDelta: 6.5,
                }}
            >
                {pickupCoords && <Marker coordinate={pickupCoords} pinColor="#0165FC" />}
                {destinationCoords && <Marker coordinate={destinationCoords} pinColor="#ffcc00" />}
                {routeCoords.length > 1 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeWidth={6}
                        strokeColor="#ffcc00"
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </MapView>

            {/* BOTTOM SHEET */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                enablePanDownToClose={false}
                backgroundStyle={{
                    backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
                }}
                handleIndicatorStyle={{
                    backgroundColor: "gray",
                }}
            >
                <BottomSheetView className="flex-1 px-5 pt-2 pb-8 justify-between">
                    <View className="w-full flex-col gap-4">
                        {/* CARD (MATCHING REFERENCE UI) */}
                        <View className="w-full bg-tertiaryWhite dark:bg-secondaryGray/20 rounded-[28px] border border-secondaryGray/10">
                            {/* TOP CARD ROW: Car info & Dynamic Price */}
                            <View className="w-full flex-row justify-between items-center p-4 rounded-[28px]  bg-general dark:bg-secondaryBlack">
                                <View className="flex-row items-center gap-3">
                                    <Image
                                        source={require("../../../assets/images/minibus.png")}
                                        className="w-20 h-16"
                                        resizeMode="cover"
                                    />
                                    <View className="flex-col">
                                        <View className="flex-row items-center gap-1">
                                            <Text className="text-lg font-GoogleSansMedium text-secondaryBlack dark:text-general">
                                                Troski
                                            </Text>

                                        </View>
                                        <View className="flex-row items-center gap-1">
                                            <Ionicons
                                                name="person"
                                                size={12}
                                                color={colorScheme === "dark" ? "#a1a1aa" : "#666"}
                                            />
                                            <Text className="text-sm font-GoogleSansMedium text-secondaryGray dark:text-tertiaryGray">
                                                {maxPassengers}
                                            </Text>
                                        </View>
                                        <Text className="text-xs font-GoogleSansRegular text-secondaryGray dark:text-tertiaryGray">
                                            Affordable fares
                                        </Text>
                                    </View>
                                </View>

                                {/* Price on the Right Hand Side */}
                                <View className="items-end">
                                    <Text className="text-xl font-GoogleSansBold text-secondaryBlack dark:text-primary">
                                        {formattedPrice}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex flex-1 justify-center items-center">
                                <View className="h-[1px] w-[95%] bg-secondaryGray/20 my-2" />

                            </View>

                            {/* BOTTOM CARD ROW: Passenger Increment Section */}
                            <View className="w-full flex-row items-center justify-between p-4">
                                {/* Minus Button */}
                                <TouchableOpacity
                                    onPress={() => changePassengerCount(-1)}
                                    disabled={passengerCount <= 1 || isProcessingPassengers}
                                    className="w-12 h-12 rounded-full bg-white dark:bg-secondaryBlack justify-center items-center "
                                    style={{ opacity: passengerCount <= 1 ? 0.4 : 1 }}
                                >
                                    <Ionicons
                                        name="remove"
                                        size={22}
                                        color={colorScheme === "dark" ? "white" : "black"}
                                    />
                                </TouchableOpacity>

                                {/* Center Passenger Counter */}
                                <View className="items-center">
                                    <Text className="text-2xl font-GoogleSansBold text-secondaryBlack dark:text-general">
                                        {passengerCount}
                                    </Text>
                                    <Text className="text-xs font-GoogleSansRegular text-secondaryGray dark:text-tertiaryGray">
                                        Number of passengers
                                    </Text>
                                </View>

                                {/* Plus Button */}
                                <TouchableOpacity
                                    onPress={() => changePassengerCount(1)}
                                    disabled={passengerCount >= maxPassengers || isProcessingPassengers}
                                    className="w-12 h-12 rounded-full bg-white dark:bg-secondaryBlack justify-center items-center "
                                    style={{ opacity: passengerCount >= maxPassengers ? 0.4 : 1 }}
                                >
                                    <Ionicons
                                        name="add"
                                        size={22}
                                        color={colorScheme === "dark" ? "white" : "black"}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* ACTION BUTTON */}
                    <View className="w-full flex-row items-center justify-center pt-4 gap-6">

                        <TouchableOpacity
                            onPress={()=>router.push("/profile/paymentMethod/setupPaymentMethod")}
                            className="h-12 justify-end items-center">
                            <Ionicons name="card-outline" size={32} color="black"/>
                        </TouchableOpacity>
                        <PrimaryButton
                            name="Book a Ride"
                            disabled={false}
                            onPress={() => {
                                const totalPrice = baseFareNumeric * passengerCount;
                                useAppStore.getState().setFinalTripPrice?.(totalPrice);

                                if (paymentMethods.length === 0) {
                                    router.push("/profile/paymentMethod/setupPaymentMethod");
                                } else {
                                    router.push("/homepage/bookings/selectPaymentMethod");
                                }
                            }}
                        />
                    </View>
                </BottomSheetView>
            </BottomSheet>

            {/* TOP NAVIGATION OVERLAY */}
            <View className="w-full absolute top-12 left-0 pl-4 right-0 flex-row justify-center items-center">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex justify-center items-center rounded-full p-2"
                    style={{
                        backgroundColor: colorScheme === "dark" ? "black" : "white",
                    }}
                >
                    <Ionicons
                        name="chevron-back"
                        size={28}
                        color={colorScheme === "dark" ? "white" : "black"}
                    />
                </TouchableOpacity>

                <View className="flex-1 items-center flex-row justify-start px-2" pointerEvents="none">
                    <View className="rounded-3xl bg-general w-[95%] h-24 flex-col justify-center items-center dark:bg-secondaryBlack">
                        <Text
                            numberOfLines={1}
                            className="text-base leading-5 font-GoogleSansMedium w-full px-4 text-center"
                            style={{
                                color: colorScheme === "dark" ? "white" : "black",
                            }}
                        >
                            {pickupPoint || "Pickup"}
                        </Text>

                            <View className="h-[1px] w-[95%] bg-secondaryGray/20 my-2" />


                        <Text
                            numberOfLines={1}
                            className="text-base font-GoogleSansMedium w-full px-4 text-center"
                            style={{
                                color: colorScheme === "dark" ? "#ffcc00" : "black",
                            }}
                        >
                            {destinationPoint || "Destination"}
                        </Text>
                    </View>
                </View>


            </View>
        </View>
    );
};

export default SelectRide;