import {
    View,
    Text,
    TextInput,
    Pressable,
    TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAppStore } from "@/utils/store";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import {useColorScheme} from "nativewind";

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

const GHANA_BBOX = {
    minLon: -3.3,
    minLat: 4.5,
    maxLon: 1.2,
    maxLat: 11.2,
};

const haversineKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): string => {
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
    const [isProcessing, setIsProcessing] = useState(false); // guard against double taps

    const pickupPoint = useAppStore((s) => s.pickupPoint);
    const destinationPoint = useAppStore((s) => s.destinationPoint);

    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore((s) => s.destinationCoords);

    const setPickupPoint = useAppStore((s) => s.setPickupPoint);
    const setDestinationPoint = useAppStore((s) => s.setDestinationPoint);
    const setPickupCoords = useAppStore((s) => s.setPickupCoords);
    const setDestinationCoords = useAppStore((s) => s.setDestinationCoords);
    const { colorScheme } = useColorScheme();


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

                const nearestJunction =
                    place?.street || place?.district || place?.subregion || place?.city || "Current Location";

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

    const photonUrlForQuery = (text: string) => {
        const bbox = `${GHANA_BBOX.minLon},${GHANA_BBOX.minLat},${GHANA_BBOX.maxLon},${GHANA_BBOX.maxLat}`;
        return `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=10&countrycode=gh&bbox=${encodeURIComponent(
            bbox
        )}`;
    };

    const searchPlaces = async (text: string) => {
        try {
            const res = await fetch(photonUrlForQuery(text));
            const data = await res.json();

            const features = (data.features ?? []) as any[];

            const ghanaOnly = features.filter((f) => {
                const country = f.properties?.country;
                if (!country) return false;
                return String(country).toLowerCase().includes("ghana") || String(country).toLowerCase().includes("gh");
            });

            const formattedResults: GeoFeature[] = (ghanaOnly.length ? ghanaOnly : features).map(
                (item: Omit<GeoFeature, "type">) => ({
                    ...item,
                    type: "geo",
                })
            );

            setResults(formattedResults);
        } catch (e) {
            console.log(e);
            setResults([]);
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

    const handleSelectGeo = (item: GeoFeature) => {
        if (isProcessing) return;
        setIsProcessing(true);

        const [lng, lat] = item.geometry.coordinates;
        const name = item.properties?.name || item.properties?.city || "Unknown location";

        if (activeField === "pickup") {
            setPickupPoint(name);
            setPickupCoords({ latitude: lat, longitude: lng });
            setSearch("");
            setResults([]);
            setActiveField(null);


            setTimeout(() => {
                goNextIfReady(name, undefined);
                setIsProcessing(false);
            }, 100);
        } else if (activeField === "destination") {
            setDestinationPoint(name);
            setDestinationCoords({ latitude: lat, longitude: lng });
            setSearch("");
            setResults([]);
            setActiveField(null);

            setTimeout(() => {
                goNextIfReady(undefined, name);
                setIsProcessing(false);
            }, 100);
        } else {

            setPickupPoint(name);
            setPickupCoords({ latitude: lat, longitude: lng });
            setSearch("");
            setResults([]);
            setActiveField(null);

            setTimeout(() => {
                goNextIfReady(name, undefined);
                setIsProcessing(false);
            }, 100);
        }
    };

    const geocodePlaceName = async (name: string) => {
        try {
            const res = await fetch(photonUrlForQuery(name) + "&limit=1");
            const data = await res.json();
            const feature = (data.features ?? [])[0];
            if (feature && feature.geometry && feature.geometry.coordinates) {
                const [lng, lat] = feature.geometry.coordinates;
                const country = feature.properties?.country || "";
                if (String(country).toLowerCase().includes("ghana") || String(country).toLowerCase().includes("gh")) {
                    return { latitude: lat, longitude: lng };
                }
            }
        } catch (e) {
            console.log("geocode error", e);
        }
        return null;
    };

    const rides: RideItem[] = [
        { type: "ride", id: 1, destination: "Madina Station", area: "Madina, Accra", passengercount: 8 },
        { type: "ride", id: 2, destination: "Circle", area: "Circle, Accra", passengercount: 2 },
        { type: "ride", id: 3, destination: "Kasoa Market", area: "Kasoa Road", passengercount: 10 },
        { type: "ride", id: 4, destination: "Kotoka Airport", area: "Airport, Accra", passengercount: 20 },
    ];

    const listData: ListItem[] = search.trim().length > 1 ? results : rides;

    return (
        <View style={{ backgroundColor: colorScheme === "dark"? "#000000" : "#F5F7FA" }} className="flex-1">
            <View className="p-5">
                <TouchableOpacity onPress={() => setActiveField("pickup")}>
                    <View
                        className="p-3 border rounded-xl flex flex-row items-center"
                        style={{
                            borderColor: "#444444",

                        }}
                    >
                        <Ionicons name="radio-button-on" size={22} color="#0165FC" />

                        {activeField === "pickup" ? (
                            <TextInput
                                value={search}
                                onChangeText={onChangeSearch}
                                placeholder="Search pickup (Ghana only)"
                                style={{ marginLeft: 10 }}
                                autoFocus
                                className="font-GoogleSansRegular text-base leading-5 flex-1  text-secondaryBlack dark:text-general"
                            />
                        ) : (
                            <Text className="font-GoogleSansRegular text-base leading-5 dark:text-general" style={{ marginLeft: 10}} numberOfLines={1}>
                                {pickupPoint || "Pickup point"}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveField("destination")}>
                    <View
                        className="p-3 border rounded-lg mt-3 flex flex-row items-center"
                        style={{
                            borderColor: "#16A34A",
                        }}
                    >
                        {activeField === "destination" ? (
                            <TextInput
                                className="font-GoogleSansRegular text-base leading-5 text-secondaryBlack flex-1 dark:text-general"
                                value={search}
                                onChangeText={onChangeSearch}
                                placeholder="Search destination (Ghana only)"
                                autoFocus
                            />
                        ) : (
                            <Text className="font-GoogleSansRegular text-base leading-5 text-secondaryGray ml-8 dark:text-tertiaryGray flex-1"
                                  numberOfLines={1}>
                                {destinationPoint || "Destination"}
                            </Text>
                        )}

                        <Ionicons name="apps-outline" size={22} />
                    </View>
                </TouchableOpacity>
            </View>

            <FlashList
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons
                            name="document-text-outline"
                            size={48}
                            color="gray"
                        />

                        <Text className="mt-4 text-base font-GoogleSansMedium text-secondaryGray dark:text-tertiaryGray">
                            No items found
                        </Text>

                        <Text className="mt-1 text-sm text-center px-10 font-GoogleSansRegular text-tertiaryGray">
                            There’s nothing to display right now.
                        </Text>
                    </View>
                }
                data={listData}
                keyboardShouldPersistTaps="handled"
                getItemType={()=>"geo"}
                keyExtractor={(item, index) =>
                    (item as any).type === "geo"
                        ? `geo-${(item as GeoFeature).geometry.coordinates[0]}-${(item as GeoFeature).geometry.coordinates[1]}-${index}`
                        : `ride-${(item as RideItem).id}`
                }
                renderItem={({ item }) => {
                    if ((item as any).type === "geo") {
                        const geo = item as GeoFeature;
                        const name = geo.properties?.name || geo.properties?.city || "Place";
                        const subtitle = [geo.properties?.city, geo.properties?.state, geo.properties?.country].filter(Boolean).join(", ");

                        return (
                            <Pressable
                                onPress={() => handleSelectGeo(geo)}
                                className="py-5 px-6 flex-row items-center"
                            >
                                <Ionicons name="location-outline" size={24} color={colorScheme === "dark"? "#ffffff": "#000000"}/>

                                <View className="ml-3">
                                    <Text className="font-GoogleSansMedium  dark:text-genera text-base leading-5">{name}</Text>
                                    {subtitle ? <Text className="text-secondaryGray dark:text-tertiaryGray leading-4 text-sm">{subtitle}</Text> : null}
                                </View>
                            </Pressable>
                        );
                    }

                    const ride = item as RideItem;

                    let km = "0";
                    if (pickupCoords && destinationCoords) {
                        km = haversineKm(pickupCoords.latitude, pickupCoords.longitude, destinationCoords.latitude, destinationCoords.longitude);
                    }

                    return (
                        <Pressable
                            onPress={async () => {
                                if (isProcessing) return;
                                setIsProcessing(true);

                                setDestinationPoint(ride.destination);
                                setActiveField(null);

                                const coords = await geocodePlaceName(ride.destination);
                                if (coords) {
                                    setDestinationCoords(coords);
                                } else {
                                    setDestinationCoords(null);
                                }

                                setTimeout(() => {
                                    goNextIfReady(undefined, ride.destination);
                                    setIsProcessing(false);
                                }, 100);
                            }}
                            className="px-7 py-5 flex-row justify-between items-center"
                        >
                            <Ionicons name="bus-outline" size={24} color={colorScheme === "dark"? "#ffffff": "#000000"}/>

                            <View className="flex-1 pl-4">
                                <Text className="text-base leading-5 font-GoogleSansRegular dark:text-general">{ride.destination}</Text>
                                <Text className="text-sm leading-4 text-tertiaryGray font-GoogleSansRegular dark:text-tertiaryGray">{ride.area}</Text>
                            </View>

                            <Text className="text-sm leading-4 font-GoogleSansRegular dark:text-tertiaryGray">{km} km</Text>
                        </Pressable>
                    );
                }}
            />
        </View>
    );
};

export default Index;
