import {
    View,
    Text,
    TextInput,
    Pressable,
    TouchableOpacity,
    FlatList,
} from "react-native";

import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAppStore } from "@/utils/store";
import { useRouter } from "expo-router";

type GeoFeature = {
    type: "geo";
    properties: {
        name?: string;
        city?: string;
        state?: string;
        country?: string;
        osm_id?: string | number;
    };
    geometry: {
        coordinates: [number, number];
    };
};

type RideItem = {
    type: "ride";
    id: number;
    destination: string;
    area: string;
    passengercount: number;
};

type ListItem = GeoFeature | RideItem;

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
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

const Index = () => {
    const router = useRouter();

    const [activeField, setActiveField] = useState<"pickup" | "destination" | null>(null);

    const [search, setSearch] = useState<string>("");
    const [results, setResults] = useState<GeoFeature[]>([]);

    const pickupPoint = useAppStore((s) => s.pickupPoint);
    const destinationPoint = useAppStore((s) => s.destinationPoint);

    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore((s) => s.destinationCoords);

    const setPickupPoint = useAppStore((s) => s.setPickupPoint);
    const setDestinationPoint = useAppStore((s) => s.setDestinationPoint);

    const setPickupCoords = useAppStore((s) => s.setPickupCoords);
    const setDestinationCoords = useAppStore((s) => s.setDestinationCoords);

    const resetTrip = () => {
        setPickupPoint("");
        setDestinationPoint("");
        setPickupCoords(null);
        setDestinationCoords(null);
    };

    const goNextIfReady = (nextPickup?: string, nextDestination?: string) => {
        const finalPickup = nextPickup ?? pickupPoint;
        const finalDestination = nextDestination ?? destinationPoint;

        if (finalPickup && finalDestination) {
            router.push("/homepage/bookings/selectRide");
        }
    };

    useEffect(() => {
        resetTrip();

        const getCurrentLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (status !== "granted") return;

                const location = await Location.getCurrentPositionAsync({});

                const latitude = location.coords.latitude;
                const longitude = location.coords.longitude;

                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                });

                const place = reverseGeocode[0];

                const nearestJunction = place?.street || place?.district || place?.subregion || place?.city || "Current Location";

                const area = [place?.city, place?.region].filter(Boolean).join(", ");

                const fullLocation = area.length > 0 ? `${nearestJunction}, ${area}` : nearestJunction;

                setPickupPoint(fullLocation);

                setPickupCoords({
                    latitude,
                    longitude,
                });
            } catch (error) {
                console.log(error);
            }
        };

        getCurrentLocation();

        return () => {
            resetTrip();
        };
    }, []);

    const searchPlaces = async (text: string) => {
        try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=10`);
            const data = await res.json();

            const formattedResults: GeoFeature[] = (data.features ?? []).map((item: Omit<GeoFeature, "type">) => ({
                ...item,
                type: "geo",
            }));

            setResults(formattedResults);
        } catch (e) {
            console.log(e);
        }
    };

    const onChangeSearch = (text: string) => {
        setSearch(text);

        if (text.trim().length > 1) {
            searchPlaces(text);
        } else {
            setResults([]);
        }
    };

    const handleSelect = (item: GeoFeature) => {
        const [lng, lat] = item.geometry.coordinates;

        const name = item.properties?.name || item.properties?.city || "Unknown location";

        let nextPickup = pickupPoint;
        let nextDestination = destinationPoint;

        if (activeField === "pickup") {
            setPickupPoint(name);

            setPickupCoords({
                latitude: lat,
                longitude: lng,
            });

            nextPickup = name;
        }

        if (activeField === "destination") {
            setDestinationPoint(name);

            setDestinationCoords({
                latitude: lat,
                longitude: lng,
            });

            nextDestination = name;
        }

        setSearch("");
        setResults([]);
        setActiveField(null);

        setTimeout(() => {
            goNextIfReady(nextPickup, nextDestination);
        }, 100);
    };

    const rides: RideItem[] = [
        { type: "ride", id: 1, destination: "Madina Station", area: "Madina, Accra", passengercount: 8 },
        { type: "ride", id: 2, destination: "Circle", area: "Circle, Accra", passengercount: 2 },
        { type: "ride", id: 3, destination: "Kasoa Market", area: "Kasoa Road", passengercount: 10 },
        { type: "ride", id: 4, destination: "Kotoka Airport", area: "Airport, Accra", passengercount: 20 },
    ];

    const listData: ListItem[] = search.trim().length > 1 ? results : rides;

    return (
        <View style={{ flex: 1 }} className="bg-general">
            <View style={{ padding: 16 }}>
                <TouchableOpacity onPress={() => setActiveField("pickup")}>
                    <View
                        style={{
                            padding: 12,
                            borderWidth: 1,
                            borderRadius: 10,
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <Ionicons name="radio-button-on" size={22} color="#0165FC" />

                        {activeField === "pickup" ? (
                            <TextInput
                                value={search}
                                onChangeText={onChangeSearch}
                                placeholder="Search pickup"
                                style={{ flex: 1, marginLeft: 10 }}
                                autoFocus
                                className="font-GoogleSansRegular"
                            />
                        ) : (
                            <Text className="font-GoogleSansRegular" style={{ marginLeft: 10, flex: 1 }} numberOfLines={1}>
                                {pickupPoint || "Pickup point"}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveField("destination")}>
                    <View
                        style={{
                            padding: 12,
                            borderWidth: 1,
                            borderRadius: 10,
                            marginTop: 10,
                            flexDirection: "row",
                            alignItems: "center",
                            borderColor: "#16A34A",
                        }}
                    >
                        {activeField === "destination" ? (
                            <TextInput
                                className="font-GoogleSansRegular"
                                value={search}
                                onChangeText={onChangeSearch}
                                placeholder="Search destination"
                                style={{ flex: 1 }}
                                autoFocus
                            />
                        ) : (
                            <Text className="font-GoogleSansRegular text-secondaryGray" style={{ flex: 1, marginLeft: 32 }} numberOfLines={1}>
                                {destinationPoint || "Destination"}
                            </Text>
                        )}

                        <Ionicons name="apps-outline" size={22} />
                    </View>
                </TouchableOpacity>
            </View>

            <FlatList
                data={listData}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item, index) =>
                    item.type === "geo" ? `geo-${item.geometry.coordinates[0]}-${item.geometry.coordinates[1]}-${index}` : `ride-${item.id}`
                }
                renderItem={({ item }) => {
                    if (item.type === "geo") {
                        const name = item.properties?.name || item.properties?.city || "Place";

                        const subtitle = [item.properties?.city, item.properties?.state, item.properties?.country].filter(Boolean).join(", ");

                        return (
                            <Pressable
                                onPress={() => handleSelect(item)}
                                style={{
                                    padding: 16,
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Ionicons name="location-outline" size={20} />

                                <View style={{ marginLeft: 10 }}>
                                    <Text>{name}</Text>
                                    {subtitle ? <Text style={{ fontSize: 12, color: "gray" }}>{subtitle}</Text> : null}
                                </View>
                            </Pressable>
                        );
                    }

                    let km = "0";

                    if (pickupCoords && destinationCoords) {
                        km = haversineKm(pickupCoords.latitude, pickupCoords.longitude, destinationCoords.latitude, destinationCoords.longitude);
                    }

                    return (
                        <Pressable
                            onPress={() => {
                                setDestinationPoint(item.destination);
                                setActiveField(null);

                                setTimeout(() => {
                                    goNextIfReady(undefined, item.destination);
                                }, 100);
                            }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 24,
                                flexDirection: "row",
                                justifyContent: "space-between",
                            }}
                        >
                            <Ionicons name="bus-outline" size={24} />

                            <View style={{ flex: 1, paddingLeft: 24 }}>
                                <Text style={{ fontSize: 16 }}>{item.destination}</Text>

                                <Text style={{ fontSize: 12, color: "gray" }}>{item.area}</Text>
                            </View>

                            <Text style={{ fontSize: 12 }}>{km} km</Text>
                        </Pressable>
                    );
                }}
            />
        </View>
    );
};

export default Index;
