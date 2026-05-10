import {View, Text, Pressable} from "react-native";
import React, { useMemo, useRef, useEffect, useState } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import PrimaryButton from "@/components/PrimaryButton";
import { router } from "expo-router";
import SelectRideType from "@/components/ui/SelectRideType";

import MapView, { Marker, Polyline } from "react-native-maps";
import { useAppStore } from "@/utils/store";
import {Ionicons} from "@expo/vector-icons";


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

    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore((s) => s.destinationCoords);

    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [durationText, setDurationText] = useState<string>("");
    const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

    const animateToBounds = () => {
        if (!mapRef.current || !pickupCoords || !destinationCoords) return;

        const midLat = (pickupCoords.latitude + destinationCoords.latitude) / 2;
        const midLng = (pickupCoords.longitude + destinationCoords.longitude) / 2;

        const latDelta = Math.max(Math.abs(pickupCoords.latitude - destinationCoords.latitude) * 1.6, 0.01);
        const lngDelta = Math.max(Math.abs(pickupCoords.longitude - destinationCoords.longitude) * 1.6, 0.01);

        mapRef.current.animateToRegion(
            {
                latitude: midLat,
                longitude: midLng,
                latitudeDelta: latDelta,
                longitudeDelta: lngDelta,
            },
            600
        );
    };

    useEffect(() => {
        const getRoute = async () => {
            if (!pickupCoords || !destinationCoords) return;

            try {
                const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
                let res;
                let data;

                if (GOOGLE_KEY && GOOGLE_KEY.length > 0) {
                    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupCoords.latitude},${pickupCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&key=${GOOGLE_KEY}`;
                    res = await fetch(url);
                    data = await res.json();

                    if (!data.routes || data.routes.length === 0) {
                        setRouteCoords([]);
                        setDurationMinutes(null);
                        return;
                    }

                    const route = data.routes[0];
                    const encoded = route?.overview_polyline?.points;
                    const legs = route?.legs?.[0];

                    if (encoded) {
                        const decoded = decodePolyline(encoded);
                        const safeCoords = decoded.filter(
                            (p) => p && typeof p.latitude === "number" && typeof p.longitude === "number"
                        );
                        setRouteCoords(safeCoords);
                    } else {
                        setRouteCoords([]);
                    }

                    const durationSeconds = legs?.duration?.value;
                    if (typeof durationSeconds === "number") {
                        setDurationMinutes(Math.max(1, Math.round(durationSeconds / 60)));
                    } else if (legs?.duration?.text) {
                        setDurationMinutes(null);
                        setDurationText(legs.duration.text || "");
                    } else {
                        setDurationMinutes(null);
                        setDurationText("");
                    }
                } else {

                    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.longitude},${pickupCoords.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=polyline&steps=false`;
                    res = await fetch(osrmUrl);
                    data = await res.json();

                    if (!data.routes || data.routes.length === 0) {
                        setRouteCoords([]);
                        setDurationMinutes(null);
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
                        const safeCoords = decoded.filter(
                            (p) => p && typeof p.latitude === "number" && typeof p.longitude === "number"
                        );
                        setRouteCoords(safeCoords);
                    } else {
                        setRouteCoords([]);
                    }
                }

                setTimeout(() => {
                    animateToBounds();
                }, 300);
            } catch (err) {
                console.log("Route error:", err);
                setRouteCoords([]);
                setDurationMinutes(null);
            }
        };

        getRoute();
    }, [pickupCoords, destinationCoords]);


    return (
        <View style={{ flex: 1 }} className="w-full bg-general">
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: pickupCoords?.latitude || 6.6735,
                    longitude: pickupCoords?.longitude || -1.5654,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {pickupCoords && <Marker coordinate={pickupCoords} pinColor="#ffcc00" />}

                {destinationCoords && (
                    <Marker coordinate={destinationCoords} pinColor="#ffcc00">
                        <View style={{ alignItems: "center" }}>
                            {durationMinutes ? (
                                <View
                                    style={{
                                        backgroundColor: "rgba(0,0,0,0.85)",
                                        paddingVertical: 8,
                                        paddingHorizontal: 12,
                                        borderRadius: 8,
                                        marginBottom: 6,
                                    }}
                                >
                                    <Text className="font-GoogleSansRegular" style={{ color: "white", fontSize: 12 }}>{durationMinutes} min</Text>
                                </View>
                            ) : durationText ? (
                                <View
                                    style={{
                                        backgroundColor: "black",
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 8,
                                        marginBottom: 6,
                                    }}
                                >
                                    <Text className="font-GoogleSansRegular" style={{ color: "white", fontSize: 10, backgroundColor: "black" }}>{durationText}</Text>
                                </View>
                            ) : null}

                            <View
                                className="rounded-full"
                                style={{
                                    width: 16,
                                    height: 16,
                                    backgroundColor: "#ffcc00",

                                }}
                            />
                        </View>
                    </Marker>
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
                backgroundStyle={{ backgroundColor: "white" }}
            >
                <BottomSheetView>
                    <View style={{ padding: 16 }}>
                        <SelectRideType duration={durationMinutes ? `${durationMinutes} min` : durationText} />
                    </View>
                </BottomSheetView>
            </BottomSheet>

            <View style={{ bottom: 30 }} className="w-full absolute flex items-center justify-center">
                <PrimaryButton name="Select Troski" disabled={false} onPress={() => router.push("/")} />
            </View>

            <View
                style={{
                    position: "absolute",
                    top: 30,
                    left: 0,
                    right: 0,
                    height: 56,
                    zIndex: 20,
                    paddingHorizontal: 12,
                    justifyContent: "center",
                }}
                className="w-full flex-row items-center"
            >
                <Pressable
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: "white",
                        padding: 10,
                        borderRadius: 999,
                        elevation: 5,
                        marginRight: 12,
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color="black" />
                </Pressable>

                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 8,
                    }}
                    pointerEvents="none"
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            padding: 10,
                        }}
                        className="rounded-full bg-general"
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                color: "black",
                                fontWeight: "600",
                                fontSize: 14,
                                maxWidth: "40%",
                                textAlign: "right",
                            }}
                        >
                            {pickupCoords && pickupCoords.latitude ? (useAppStore.getState().pickupPoint || "Pickup") : (useAppStore.getState().pickupPoint || "Pickup")}
                        </Text>

                        <Ionicons name="arrow-forward" size={14} color="black" style={{ marginHorizontal: 8 }} />

                        <Text
                            numberOfLines={1}
                            style={{
                                color: "black",
                                fontWeight: "600",
                                fontSize: 14,
                                maxWidth: "40%",
                                textAlign: "left",
                            }}
                        >
                            {destinationCoords && destinationCoords.latitude ? (useAppStore.getState().destinationPoint || "Destination") : (useAppStore.getState().destinationPoint || "Destination")}
                        </Text>
                    </View>
                </View>

                <View style={{ width: 52 }} />
            </View>

        </View>
    );
};

export default SelectRide;
