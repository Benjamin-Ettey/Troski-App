
import {
    View,
    Text,
    TextInput,
    Pressable,
    TouchableOpacity,
    Animated,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAppStore } from "@/utils/store";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useColorScheme } from "nativewind";

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
    const { colorScheme } = useColorScheme();

    const [activeField, setActiveField] = useState<
        "pickup" | "destination" | null
    >(null);

    // Separate search text for each field.
    const [pickupSearch, setPickupSearch] = useState("");
    const [destinationSearch, setDestinationSearch] = useState("");

    const [results, setResults] = useState<GeoFeature[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Independent floating-label animations.
    const pickupLabelAnim = useRef(new Animated.Value(0)).current;
    const destinationLabelAnim = useRef(new Animated.Value(0)).current;

    const pickupPoint = useAppStore((s) => s.pickupPoint);
    const destinationPoint = useAppStore((s) => s.destinationPoint);

    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore((s) => s.destinationCoords);

    const setPickupPoint = useAppStore((s) => s.setPickupPoint);
    const setDestinationPoint = useAppStore(
        (s) => s.setDestinationPoint
    );
    const setPickupCoords = useAppStore((s) => s.setPickupCoords);
    const setDestinationCoords = useAppStore(
        (s) => s.setDestinationCoords
    );

    const isDark = colorScheme === "dark";

    const search =
        activeField === "pickup"
            ? pickupSearch
            : activeField === "destination"
                ? destinationSearch
                : "";

    const setActiveSearch = (text: string) => {
        if (activeField === "pickup") {
            setPickupSearch(text);
        } else if (activeField === "destination") {
            setDestinationSearch(text);
        }
    };

    const resetTrip = () => {
        setPickupPoint("");
        setDestinationPoint("");
        setPickupCoords(null);
        setDestinationCoords(null);
    };

    const goNextIfReady = (
        nextPickup?: string,
        nextDestination?: string
    ) => {
        const finalPickup = nextPickup ?? pickupPoint;
        const finalDestination =
            nextDestination ?? destinationPoint;

        if (finalPickup && finalDestination) {
            router.push("/homepage/bookings/selectRide");
        }
    };

    // Animate the floating label when a field becomes active.
    useEffect(() => {
        Animated.timing(pickupLabelAnim, {
            toValue: activeField === "pickup" ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();

        Animated.timing(destinationLabelAnim, {
            toValue: activeField === "destination" ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [
        activeField,
        pickupLabelAnim,
        destinationLabelAnim,
    ]);

    // Get the passenger's current location.
    useEffect(() => {
        resetTrip();

        let cancelled = false;

        const getCurrentLocation = async () => {
            try {
                const { status } =
                    await Location.requestForegroundPermissionsAsync();

                if (status !== "granted" || cancelled) return;

                const location =
                    await Location.getCurrentPositionAsync({});

                if (cancelled) return;

                const latitude = location.coords.latitude;
                const longitude = location.coords.longitude;

                const reverseGeocode =
                    await Location.reverseGeocodeAsync({
                        latitude,
                        longitude,
                    });

                if (cancelled) return;

                const place = reverseGeocode[0];

                const nearestJunction =
                    place?.street ||
                    place?.district ||
                    place?.subregion ||
                    place?.city ||
                    "Current Location";

                const area = [
                    place?.city,
                    place?.region,
                ]
                    .filter(Boolean)
                    .join(", ");

                const fullLocation = area
                    ? `${nearestJunction}, ${area}`
                    : nearestJunction;

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
            cancelled = true;
            resetTrip();
        };
    }, []);

    const photonUrlForQuery = (text: string) => {
        const bbox = `${GHANA_BBOX.minLon},${GHANA_BBOX.minLat},${GHANA_BBOX.maxLon},${GHANA_BBOX.maxLat}`;

        return `https://photon.komoot.io/api/?q=${encodeURIComponent(
            text
        )}&limit=10&countrycode=gh&bbox=${encodeURIComponent(bbox)}`;
    };

    const searchPlaces = async (text: string) => {
        try {
            const res = await fetch(photonUrlForQuery(text));
            const data = await res.json();

            const features = (data.features ?? []) as GeoFeature[];

            const ghanaOnly = features.filter((feature) => {
                const country = feature.properties?.country;

                if (!country) return false;

                return (
                    String(country)
                        .toLowerCase()
                        .includes("ghana") ||
                    String(country)
                        .toLowerCase()
                        .includes("gh")
                );
            });

            const formattedResults = (
                ghanaOnly.length ? ghanaOnly : features
            ).map((item) => ({
                ...item,
                type: "geo" as const,
            }));

            setResults(formattedResults);
        } catch (error) {
            console.log(error);
            setResults([]);
        }
    };

    const onChangeSearch = (text: string) => {
        setActiveSearch(text);

        if (text.trim().length > 1) {
            searchPlaces(text);
        } else {
            setResults([]);
        }
    };

    const openField = (
        field: "pickup" | "destination"
    ) => {
        if (activeField === field) return;

        setResults([]);

        // Restore the text previously entered in this field.
        setActiveField(field);

        const fieldSearch =
            field === "pickup"
                ? pickupSearch
                : destinationSearch;

        if (fieldSearch.trim().length > 1) {
            searchPlaces(fieldSearch);
        }
    };

    const handleSelectGeo = (item: GeoFeature) => {
        if (isProcessing) return;

        setIsProcessing(true);

        const [lng, lat] = item.geometry.coordinates;

        const name =
            item.properties?.name ||
            item.properties?.city ||
            "Unknown location";

        if (activeField === "pickup") {
            setPickupPoint(name);
            setPickupCoords({
                latitude: lat,
                longitude: lng,
            });
            setPickupSearch("");
        } else if (activeField === "destination") {
            setDestinationPoint(name);
            setDestinationCoords({
                latitude: lat,
                longitude: lng,
            });
            setDestinationSearch("");
        } else {
            setPickupPoint(name);
            setPickupCoords({
                latitude: lat,
                longitude: lng,
            });
            setPickupSearch("");
        }

        setResults([]);
        setActiveField(null);

        setTimeout(() => {
            if (activeField === "pickup") {
                goNextIfReady(name, undefined);
            } else if (activeField === "destination") {
                goNextIfReady(undefined, name);
            } else {
                goNextIfReady(name, undefined);
            }

            setIsProcessing(false);
        }, 100);
    };

    const geocodePlaceName = async (name: string) => {
        try {
            const res = await fetch(
                photonUrlForQuery(name) + "&limit=1"
            );

            const data = await res.json();
            const feature = data.features?.[0];

            if (
                feature?.geometry?.coordinates
            ) {
                const [lng, lat] =
                    feature.geometry.coordinates;

                const country =
                    feature.properties?.country || "";

                if (
                    String(country)
                        .toLowerCase()
                        .includes("ghana") ||
                    String(country)
                        .toLowerCase()
                        .includes("gh")
                ) {
                    return {
                        latitude: lat,
                        longitude: lng,
                    };
                }
            }
        } catch (error) {
            console.log("geocode error", error);
        }

        return null;
    };

    const rides: RideItem[] = [
        {
            type: "ride",
            id: 1,
            destination: "Madina Station",
            area: "Madina, Accra",
            passengercount: 8,
        },
        {
            type: "ride",
            id: 2,
            destination: "Circle",
            area: "Circle, Accra",
            passengercount: 2,
        },
        {
            type: "ride",
            id: 3,
            destination: "Kasoa Market",
            area: "Kasoa Road",
            passengercount: 10,
        },
        {
            type: "ride",
            id: 4,
            destination: "Kotoka Airport",
            area: "Airport, Accra",
            passengercount: 20,
        },
    ];

    const listData: ListItem[] =
        search.trim().length > 1 ? results : rides;

    // Field appearance.
    const fieldBackground = (isActive: boolean) =>
        isActive
            ? isDark
                ? "#111111"
                : "#FFFFFF"
            : isDark
                ? "#202020"
                : "#E9EAED";

    const fieldBorder = (isActive: boolean) =>
        isActive
            ? isDark
                ? "#FFFFFF"
                : "#171717"
            : "transparent";

    const fieldTextColor = isDark
        ? "#FFFFFF"
        : "#171717";

    const mutedColor = isDark
        ? "#A3A3A3"
        : "#737373";

    const renderLocationField = (
        field: "pickup" | "destination",
        label: "From" | "To",
        selectedValue: string,
        inactiveIcon: "hand-left" | "location-outline",
        animation: Animated.Value,
        fieldSearch: string
    ) => {
        const isActive = activeField === field;

        const labelTop = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 6],
        });

        const labelSize = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [24, 12],
        });

        return (
            <View
                key={field}
                className="mb-3"
                style={{
                    backgroundColor: fieldBackground(isActive),
                    borderColor: fieldBorder(isActive),
                    borderWidth: isActive ? 1.5 : 1,
                    borderRadius: 9,
                    minHeight: 54,
                    justifyContent: "center",
                }}
            >
                {isActive ? (
                    <View className="flex-row items-center px-4">
                        <Ionicons
                            name="search-outline"
                            size={21}
                            color={mutedColor}
                        />

                        <View
                            className="flex-1 ml-3"
                            style={{
                                minHeight: 54,
                                justifyContent: "center",
                            }}
                        >
                            <Animated.Text
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    top: labelTop,
                                    fontSize: labelSize,
                                    color: mutedColor,
                                    fontFamily: "GoogleSansRegular",
                                }}
                            >
                                {label}
                            </Animated.Text>

                            <TextInput
                                value={fieldSearch}
                                onChangeText={onChangeSearch}
                                autoFocus={true}
                                placeholder=""
                                selectionColor={fieldTextColor}
                                autoCapitalize="words"
                                returnKeyType="search"
                                style={{
                                    color: fieldTextColor,
                                    fontFamily: "GoogleSansRegular",
                                    fontSize: 16,
                                    paddingTop: 20,
                                    paddingBottom: 5,
                                    paddingHorizontal: 0,
                                }}
                            />
                        </View>

                        {fieldSearch.length > 0 && (
                            <Pressable
                                onPress={() => {
                                    setActiveSearch("");
                                    setResults([]);
                                }}
                                hitSlop={10}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color={mutedColor}
                                />
                            </Pressable>
                        )}
                    </View>
                ) : (
                    <Pressable
                        onPress={() => openField(field)}
                        className="flex-row items-center px-4"
                        style={{ minHeight: 54 }}
                    >
                        <Ionicons
                            name={label==="From"? "hand-left": "flag"}
                            size={22}
                            color={mutedColor}
                        />

                        <Text
                            numberOfLines={1}
                            className="flex-1 ml-3 font-GoogleSansRegular text-base"
                            style={{
                                color: selectedValue
                                    ? fieldTextColor
                                    : mutedColor,
                            }}
                        >
                            {selectedValue || label}
                        </Text>
                    </Pressable>
                )}
            </View>
        );
    };

    return (
        <View
            style={{
                backgroundColor: isDark ? "#000000" : "#F5F7FA",
            }}
            className="flex-1"
        >
            <View className="p-5">
                {renderLocationField(
                    "pickup",
                    "From",
                    pickupPoint,
                    "hand-left",
                    pickupLabelAnim,
                    pickupSearch
                )}

                {renderLocationField(
                    "destination",
                    "To",
                    destinationPoint,
                    "location-outline",
                    destinationLabelAnim,
                    destinationSearch
                )}
            </View>

            <FlashList
                data={listData}
                keyboardShouldPersistTaps="handled"
                getItemType={(item) => item.type}
                keyExtractor={(item, index) =>
                    item.type === "geo"
                        ? `geo-${item.geometry.coordinates[0]}-${item.geometry.coordinates[1]}-${index}`
                        : `ride-${item.id}`
                }
                ListHeaderComponent={
                <View className="px-6 pb-4">
                    <Text className="self-start text-general dark:text-secondaryBlack dark:bg-tertiaryWhite bg-secondaryBlack px-3 py-1.5 rounded-full font-GoogleSansMedium text-base">Suggested Destinations</Text>
                </View>
                }

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
                renderItem={({ item }) => {
                    if (item.type === "geo") {
                        const geo = item;

                        const name =
                            geo.properties?.name ||
                            geo.properties?.city ||
                            "Place";

                        const subtitle = [
                            geo.properties?.city,
                            geo.properties?.state,
                            geo.properties?.country,
                        ]
                            .filter(Boolean)
                            .join(", ");

                        return (
                            <Pressable
                                onPress={() =>
                                    handleSelectGeo(geo)
                                }
                                className="py-5 px-6 flex-row items-center"
                            >
                                <Ionicons
                                    name="location-outline"
                                    size={24}
                                    color={isDark ? "#FFFFFF" : "#000000"}
                                />

                                <View className="ml-3 flex-1">
                                    <Text className="font-GoogleSansMedium text-base leading-5 text-secondaryBlack dark:text-general">
                                        {name}
                                    </Text>

                                    {subtitle ? (
                                        <Text className="text-secondaryGray dark:text-tertiaryGray leading-4 text-sm">
                                            {subtitle}
                                        </Text>
                                    ) : null}
                                </View>
                            </Pressable>
                        );
                    }

                    const ride = item;

                    let km = "0";

                    if (pickupCoords && destinationCoords) {
                        km = haversineKm(
                            pickupCoords.latitude,
                            pickupCoords.longitude,
                            destinationCoords.latitude,
                            destinationCoords.longitude
                        );
                    }

                    return (
                        <Pressable
                            onPress={async () => {
                                if (isProcessing) return;

                                setIsProcessing(true);

                                setDestinationPoint(
                                    ride.destination
                                );

                                setDestinationSearch("");
                                setResults([]);
                                setActiveField(null);

                                const coords =
                                    await geocodePlaceName(
                                        ride.destination
                                    );

                                if (coords) {
                                    setDestinationCoords(coords);
                                } else {
                                    setDestinationCoords(null);
                                }

                                setTimeout(() => {
                                    goNextIfReady(
                                        undefined,
                                        ride.destination
                                    );
                                    setIsProcessing(false);
                                }, 100);
                            }}
                            className="px-7 py-5 flex-row justify-between items-center"
                        >
                            <Ionicons
                                name="flag"
                                size={20}
                                color={isDark ? "#E9EAED": "#20202088"}
                            />

                            <View className="flex-1 pl-4">
                                <Text className="text-lg leading-5 font-GoogleSansRegular text-secondaryBlack dark:text-general">
                                    {ride.destination}
                                </Text>

                                <Text className="text-sm leading-4 text-secondaryGray font-GoogleSansRegular dark:text-tertiaryGray">
                                    {ride.area}
                                </Text>
                            </View>

                            <Text className="text-lg leading-none font-GoogleSansRegular dark:text-tertiaryGray">
                                {km} km
                            </Text>
                        </Pressable>
                    );
                }}
            />
        </View>
    );
};

export default Index;