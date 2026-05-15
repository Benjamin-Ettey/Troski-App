import {View, Text, Pressable, TouchableOpacity} from "react-native";
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

const SelectRide = () => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const mapRef = useRef<MapView>(null);

    const snapPoints = useMemo(() => ["50%", "80%"], []);

    const pickupCoordsRaw = useAppStore((s) => s.pickupCoords);
    const destinationCoordsRaw = useAppStore((s) => s.destinationCoords);
    const tripPrice = useAppStore((s) => s.tripPrice);
    const pickupPoint = useAppStore((s) => s.pickupPoint);
    const destinationPoint = useAppStore((s) => s.destinationPoint);
    const { colorScheme } = useColorScheme();

    const pickupCoords = pickupCoordsRaw
        ? clampToGhana(pickupCoordsRaw.latitude, pickupCoordsRaw.longitude)
        : null;
    const destinationCoords = destinationCoordsRaw
        ? clampToGhana(destinationCoordsRaw.latitude, destinationCoordsRaw.longitude)
        : null;

    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [durationText, setDurationText] = useState<string>("");
    const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

    const animateToBounds = () => {
        if (!mapRef.current || !pickupCoords || !destinationCoords) return;

        mapRef.current.fitToCoordinates(
            [pickupCoords, destinationCoords],
            {
                edgePadding: {
                    top: 80,
                    right: 80,
                    bottom: 350,
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
        <View style={{backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA", flex: 1 }} className="w-full ">
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
                index={1}
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
                <BottomSheetView>
                    <View>
                        <View style={{ paddingBottom: 16, gap: 12 }} className="w-full flex flex-col justify-center items-center">
                            <Text className="font-GoogleSansMedium dark:text-general">Choose a ride</Text>
                            <View style={{height: 1}} className="w-full bg-tertiaryWhite dark:bg-secondaryGray"/>
                        </View>
                        <SelectRideType duration={durationMinutes ? `${durationMinutes} min` : durationText} price={tripPrice} />
                    </View>
                </BottomSheetView>
            </BottomSheet>

            <View style={{ bottom: 30 }} className="w-full absolute flex items-center justify-center">
                <PrimaryButton name="Select Troski" disabled={false} onPress={() => router.push("/homepage/bookings/numberOfPassengers")} />
            </View>

            <View
                style={{
                    position: "absolute",
                    top: 40,
                    left: 0,
                    right: 0,
                    height: 56,
                    zIndex: 20,
                    paddingHorizontal: 12,
                    justifyContent: "center",
                }}
                className="w-full flex-row items-center"
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex justify-center items-center"
                    style={{
                        backgroundColor: colorScheme === "dark"? "black":"white",
                        padding: 8,
                        borderRadius: 999,
                        elevation: 5,
                        marginRight: 12,
                    }}
                >
                    <Ionicons name="chevron-back" size={28} color={colorScheme === "dark"? "white":"black"} />
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }} pointerEvents="none">
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            paddingHorizontal: 10,
                            paddingVertical: 12
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

                        <Ionicons name="arrow-forward" size={14} color={colorScheme === "dark"? "white":"black"} style={{ marginHorizontal: 8 }} />

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

                <View style={{ width: 52 }} />
            </View>
        </View>
    );
};

export default SelectRide;