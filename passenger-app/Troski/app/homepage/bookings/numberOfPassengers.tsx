import {View, Text, TouchableOpacity} from "react-native";
import React, { useMemo, useRef, useEffect, useState } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import PrimaryButton from "@/components/PrimaryButton";
import { router } from "expo-router";
import SelectRideType from "@/components/ui/SelectRideType";

import MapView, { Marker, Polyline } from "react-native-maps";
import { useAppStore } from "@/utils/store";
import { Ionicons } from "@expo/vector-icons";
import {useColorScheme} from "nativewind";

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

const NumberOfPassengers = () => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const mapRef = useRef<MapView>(null);

    const paymentMethods = useAppStore((s) => s.paymentMethods);
    const snapPoints = useMemo(() => ["50%"], []);

    const pickupCoordsRaw = useAppStore((s) => s.pickupCoords);
    const destinationCoordsRaw = useAppStore((s) => s.destinationCoords);
    const tripPrice = useAppStore((s) => s.tripPrice);
    const pickupPoint = useAppStore((s) => s.pickupPoint);
    const destinationPoint = useAppStore((s) => s.destinationPoint);
    const { colorScheme } = useColorScheme();

    const maxPassengersFromStore = useAppStore((s: any) => s.selectedRideMaxPassengers ?? null);

    const pickupCoords = pickupCoordsRaw
        ? clampToGhana(pickupCoordsRaw.latitude, pickupCoordsRaw.longitude)
        : null;

    const destinationCoords = destinationCoordsRaw
        ? clampToGhana(destinationCoordsRaw.latitude, destinationCoordsRaw.longitude)
        : null;

    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [durationText, setDurationText] = useState<string>("");
    const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

    const [passengerCount, setPassengerCount] = useState<number>(1);
    const [isProcessingPassengers, setIsProcessingPassengers] = useState(false);

    const maxPassengers = typeof maxPassengersFromStore === "number" ? maxPassengersFromStore : 5;

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

    const formatLikeOriginal = (original: any, numericValue: number, decimalsFallback = 0) => {
        if (typeof original === "number") {
            return String(Number(numericValue.toFixed(decimalsFallback)));
        }
        if (typeof original === "string") {
            const match = original.match(/-?\d+(\.\d+)?/);
            const decimals = match && match[1] ? match[1].length - 1 : decimalsFallback;
            const formatted = numericValue.toFixed(decimals);
            if (match) {
                return original.replace(match[0], formatted);
            }
            return formatted;
        }
        return String(numericValue);
    };

    const parsed = extractNumericFromString(tripPrice);
    const baseFareNumeric = parsed ? parsed.value : (typeof tripPrice === "number" ? tripPrice : 0);
    const baseFareDecimals = parsed ? parsed.decimals : 0;

    const [formattedPrice, setFormattedPrice] = useState<string>(() =>
        formatLikeOriginal(tripPrice, baseFareNumeric * passengerCount, baseFareDecimals)
    );

    useEffect(() => {
        const numericTotal = baseFareNumeric * passengerCount;
        const next = formatLikeOriginal(tripPrice, numericTotal, baseFareDecimals);
        setFormattedPrice(next);
    }, [passengerCount, tripPrice, baseFareNumeric]);

    const changePassengerCount = (delta: number) => {
        if (isProcessingPassengers) return;
        setIsProcessingPassengers(true);

        setPassengerCount((prev) => {
            const next = Math.max(1, Math.min(maxPassengers, prev + delta));
            return next;
        });

        setTimeout(() => setIsProcessingPassengers(false), 80);
    };

    const animateToBounds = () => {
        if (!mapRef.current || !pickupCoords || !destinationCoords) return;

        mapRef.current.fitToCoordinates(
            [pickupCoords, destinationCoords],
            {
                edgePadding: {
                    top: 80,
                    right: 80,
                    bottom: 380,
                    left: 80,
                },
                animated: true,
            }
        );
    };

    useEffect(() => {
        const getRoute = async () => {
            if (!pickupCoords || !destinationCoords) {
                setRouteCoords([]);
                setDurationMinutes(null);
                setDurationText("");
                return;
            }

            try {
                const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

                if (GOOGLE_KEY && GOOGLE_KEY.length > 0) {
                    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupCoords.latitude},${pickupCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&key=${GOOGLE_KEY}`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (!data.routes || data.routes.length === 0) {
                        setRouteCoords([]);
                        setDurationMinutes(null);
                        setDurationText("");
                        return;
                    }

                    const route = data.routes[0];
                    const encoded = route?.overview_polyline?.points;
                    const legs = route?.legs?.[0];

                    if (encoded) {
                        const decoded = decodePolyline(encoded);
                        const safeCoords = decoded.filter((p) => p && typeof p.latitude === "number" && typeof p.longitude === "number");
                        setRouteCoords(safeCoords);
                    } else {
                        setRouteCoords([]);
                    }

                    const durationSeconds = legs?.duration?.value;
                    if (typeof durationSeconds === "number") {
                        setDurationMinutes(Math.max(1, Math.round(durationSeconds / 60)));
                        setDurationText(`${Math.max(1, Math.round(durationSeconds / 60))} min`);
                    } else if (legs?.duration?.text) {
                        setDurationMinutes(null);
                        setDurationText(legs.duration.text || "");
                    } else {
                        setDurationMinutes(null);
                        setDurationText("");
                    }
                } else {
                    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.longitude},${pickupCoords.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=polyline&steps=false`;

                    const res = await fetch(osrmUrl);
                    const data = await res.json();

                    if (!data.routes || data.routes.length === 0) {
                        setRouteCoords([]);
                        setDurationMinutes(null);
                        setDurationText("");
                        return;
                    }

                    const route = data.routes[0];

                    const durationSeconds = route?.duration;
                    if (typeof durationSeconds === "number") {
                        setDurationMinutes(Math.max(1, Math.round(durationSeconds / 60)));
                        setDurationText(`${Math.max(1, Math.round(durationSeconds / 60))} min`);
                    } else {
                        setDurationMinutes(null);
                        setDurationText("");
                    }

                    const encoded = route?.geometry;
                    if (encoded) {
                        const decoded = decodePolyline(encoded);
                        const safeCoords = decoded.filter((p) => p && typeof p.latitude === "number" && typeof p.longitude === "number");
                        setRouteCoords(safeCoords);
                    } else {
                        setRouteCoords([]);
                    }
                }

                requestAnimationFrame(() => {
                    animateToBounds();
                });

            } catch (err) {
                console.log("Route error:", err);
                setRouteCoords([]);
                setDurationMinutes(null);
                setDurationText("");
            }
        };

        getRoute();
    }, [pickupCoordsRaw, destinationCoordsRaw]);

    return (
        <View style={{ flex: 1 }} className="w-full bg-general">
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
                {pickupCoords && (
                    <Marker coordinate={pickupCoords} pinColor="#0165FC"/>
                )}

                {destinationCoords && (
                    <Marker coordinate={destinationCoords} pinColor="#ffcc00"/>
                )}

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

            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={false}
                backgroundStyle={{
                    backgroundColor: colorScheme === "dark"? "#000000" : "#ffffff",
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
                <BottomSheetView className="pb-14">
                    <View>
                        <View
                              className="w-full flex flex-col gap-4 pb-4 justify-center items-center">
                            <Text className="font-GoogleSansMedium text-base leading-5 dark:text-general">Number of passengers</Text>
                            <View style={{height: 1}} className="w-full bg-tertiaryWhite dark:bg-secondaryGray"/>
                        </View>
                        <SelectRideType duration={durationMinutes ? `${durationMinutes} min` : durationText} price={formattedPrice} />



                            <View className="mt-28 flex flex-row items-center justify-between px-14 mb-24" >
                                <TouchableOpacity
                                    onPress={() => changePassengerCount(-1)}
                                    disabled={passengerCount <= 1 || isProcessingPassengers}
                                    style={{
                                        backgroundColor: passengerCount <= 1 ? "#ddd" : "#e4e4e4",

                                    }}
                                    className="rounded-full h-14 w-14 justify-center items-center"
                                >
                                    <Ionicons name="remove" size={16} style={{ color: passengerCount <= 1 ? "#999" : "#000" }}/>
                                </TouchableOpacity>

                                <View className=" flex justify-center items-center" >
                                    <Text className="text-secondaryBlack dark:text-general font-GoogleSansBold text-4xl">{passengerCount}</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => changePassengerCount(1)}
                                    disabled={passengerCount >= maxPassengers || isProcessingPassengers}
                                    style={{
                                        backgroundColor: passengerCount >= maxPassengers ? "#ddd" : "#e4e4e4",
                                    }}
                                    className="rounded-full h-14 w-14 justify-center items-center"
                                >
                                    <Ionicons name="add" size={16} style={{ color: passengerCount >= maxPassengers ? "#999" : "#000" }}/>
                                </TouchableOpacity>
                            </View>


                        <View className="w-full absolute bottom-0 flex items-center justify-center">


                            <PrimaryButton
                                name="Continue"
                                disabled={false}
                                onPress={() => {
                                    const totalPrice = baseFareNumeric * passengerCount;
                                    useAppStore.getState().setFinalTripPrice(totalPrice);

                                    if (paymentMethods.length === 0) {
                                        router.push("/profile/paymentMethod/setupPaymentMethod");
                                    } else {
                                        router.push("/homepage/bookings/selectPaymentMethod");
                                    }
                                }}
                            />
                        </View>


                    </View>

                </BottomSheetView>
            </BottomSheet>


            <View

                className="w-full absolute top-12 left-0 pl-4 right-0 flex-row justify-center items-center"
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex justify-center items-center rounded-full p-2"
                    style={{
                        backgroundColor: colorScheme === "dark"? "black":"white",

                    }}
                >
                    <Ionicons name="chevron-back" size={28} color={colorScheme === "dark"? "white":"black"} />
                </TouchableOpacity>

                <View
                    className="flex-1 items-center justify-center px-2"
                    pointerEvents="none">
                    <View
                        className="rounded-full bg-general w-full h-12 flex-row justify-center items-center dark:bg-secondaryBlack"
                    >
                        <Text
                            numberOfLines={1}
                            className="text-base leading-5 font-GoogleSansMedium max-w-24 text-right"
                            style={{
                                color: colorScheme === "dark"? "white":"black",

                            }}
                        >
                            {pickupPoint || "Pickup"}
                        </Text>

                        <Ionicons name="arrow-forward" size={14} color={colorScheme === "dark"? "white":"black"} style={{ marginHorizontal: 8 }} />

                        <Text
                            numberOfLines={1}
                            className="text-base leading-5 font-GoogleSansMedium max-w-24 text-left"
                            style={{
                                color: colorScheme === "dark"? "#ffcc00":"black",
                            }}
                        >
                            {destinationPoint || "Destination"}
                        </Text>
                    </View>
                </View>

                <View style={{ width: 52 }} />
            </View>
        </View>
    );
};

export default NumberOfPassengers;