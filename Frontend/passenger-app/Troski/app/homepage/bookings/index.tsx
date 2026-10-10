// @ts-ignore

import {
    View,
    Text,
    TextInput,
    Pressable,
    Animated,
} from "react-native";
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/utils/store";
import { useFocusEffect, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useColorScheme } from "nativewind";
import PaginateSuggestedDestination from "@/components/ui/PaginateSuggestedDestination";
import { KeyboardToolbar } from "react-native-keyboard-controller";

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

    const c =
        2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c).toFixed(1);
};

const Index = () => {
    const router = useRouter();
    const { colorScheme } = useColorScheme();

    const [activeField, setActiveField] = useState<
        "pickup" | "destination" | null
    >(null);

    const [pickupSearch, setPickupSearch] = useState("");
    const [destinationSearch, setDestinationSearch] =
        useState("");

    const [results, setResults] = useState<GeoFeature[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Floating-label animations
    const pickupLabelAnim = useRef(
        new Animated.Value(0)
    ).current;

    const destinationLabelAnim = useRef(
        new Animated.Value(0)
    ).current;

    // Input references
    const pickupInputRef = useRef<TextInput>(null);
    const destinationInputRef = useRef<TextInput>(null);

    // Prevent older search requests from replacing newer results
    const searchRequestId = useRef(0);

    // Store values
    const pickupPoint = useAppStore((s) => s.pickupPoint);
    const destinationPoint = useAppStore(
        (s) => s.destinationPoint
    );

    const pickupCoords = useAppStore((s) => s.pickupCoords);
    const destinationCoords = useAppStore(
        (s) => s.destinationCoords
    );

    const setPickupPoint = useAppStore(
        (s) => s.setPickupPoint
    );

    const setDestinationPoint = useAppStore(
        (s) => s.setDestinationPoint
    );

    const setPickupCoords = useAppStore(
        (s) => s.setPickupCoords
    );

    const setDestinationCoords = useAppStore(
        (s) => s.setDestinationCoords
    );

    const isDark = colorScheme === "dark";

    // Activate pickup when the screen gains focus.
    useFocusEffect(
        useCallback(() => {
            setActiveField("pickup");

            const timer = setTimeout(() => {
                pickupInputRef.current?.focus();
            }, 300);

            return () => {
                clearTimeout(timer);
            };
        }, [])
    );

    // The text belonging to the currently active field.
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

    // Animate the floating labels.
    useEffect(() => {
        Animated.timing(pickupLabelAnim, {
            toValue: activeField === "pickup" ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();

        Animated.timing(destinationLabelAnim, {
            toValue:
                activeField === "destination" ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [
        activeField,
        pickupLabelAnim,
        destinationLabelAnim,
    ]);

    // Photon search URL restricted to Ghana.
    const photonUrlForQuery = (text: string) => {
        const bbox =
            `${GHANA_BBOX.minLon},${GHANA_BBOX.minLat},` +
            `${GHANA_BBOX.maxLon},${GHANA_BBOX.maxLat}`;

        return (
            `https://photon.komoot.io/api/?q=${encodeURIComponent(
    text
)}&limit=10&countrycode=gh&bbox=${encodeURIComponent(
    bbox
)}`
        );
    };

    // Search locations without allowing stale requests
    // to overwrite the most recent search.
    const searchPlaces = async (text: string) => {
        const query = text.trim();
        const requestId = ++searchRequestId.current;

        if (query.length <= 1) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        try {
            const response = await fetch(
                photonUrlForQuery(query)
            );

            if (!response.ok) {
                throw new Error(
                    `Location search failed: ${response.status}`
                );
            }

            const data = await response.json();

            // Ignore responses from older queries.
            if (requestId !== searchRequestId.current) {
                return;
            }

            const features = (
                data.features ?? []
            ) as GeoFeature[];

            const ghanaOnly = features.filter((feature) => {
                const country = feature.properties?.country;

                return (
                    !!country &&
                    String(country)
                        .toLowerCase()
                        .includes("ghana")
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
            if (requestId === searchRequestId.current) {
                console.log("Location search error:", error);
                setResults([]);
            }
        } finally {
            if (requestId === searchRequestId.current) {
                setIsSearching(false);
            }
        }
    };

    const onChangeSearch = (text: string) => {
        setActiveSearch(text);

        if (text.trim().length > 1) {
            searchPlaces(text);
        } else {
            // Invalidate any request for the previous query.
            searchRequestId.current += 1;
            setResults([]);
            setIsSearching(false);
        }
    };

    // Switch between pickup and destination fields.
    const openField = (
        field: "pickup" | "destination"
    ) => {
        if (activeField === field) {
            // The active input already owns the keyboard.
            return;
        }

        searchRequestId.current += 1;
        setResults([]);
        setIsSearching(false);
        setActiveField(field);

        const fieldSearch =
            field === "pickup"
                ? pickupSearch
                : destinationSearch;

        if (fieldSearch.trim().length > 1) {
            searchPlaces(fieldSearch);
        }

        // Focus only the requested field.
        requestAnimationFrame(() => {
            if (field === "pickup") {
                pickupInputRef.current?.focus();
            } else {
                destinationInputRef.current?.focus();
            }
        });
    };

    // Select a location and move from pickup to destination.
    const handleSelectGeo = (item: GeoFeature) => {
        if (isProcessing) return;

        setIsProcessing(true);

        const [lng, lat] = item.geometry.coordinates;

        const name =
            item.properties?.name ||
            item.properties?.city ||
            "Unknown location";

        const coordinates = {
            latitude: lat,
            longitude: lng,
        };

        searchRequestId.current += 1;
        setResults([]);
        setIsSearching(false);

        if (activeField === "pickup") {
            setPickupPoint(name);
            setPickupCoords(coordinates);
            setPickupSearch("");

            setDestinationSearch("");
            setActiveField("destination");

            requestAnimationFrame(() => {
                destinationInputRef.current?.focus();
                setIsProcessing(false);
            });

            return;
        }

        if (activeField === "destination") {
            setDestinationPoint(name);
            setDestinationCoords(coordinates);
            setDestinationSearch("");
            setActiveField(null);

            // Dismiss the keyboard after selecting a destination.
            pickupInputRef.current?.blur();
            destinationInputRef.current?.blur();

            setTimeout(() => {
                goNextIfReady(undefined, name);
                setIsProcessing(false);
            }, 100);
        }
    };

    // Geocode suggested ride destinations.
    const geocodePlaceName = async (name: string) => {
        try {
            const response = await fetch(
                photonUrlForQuery(name)
            );

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            const feature = data.features?.[0];

            if (feature?.geometry?.coordinates) {
                const [lng, lat] =
                    feature.geometry.coordinates;

                const country =
                    feature.properties?.country || "";

                if (
                    String(country)
                        .toLowerCase()
                        .includes("ghana")
                ) {
                    return {
                        latitude: lat,
                        longitude: lng,
                    };
                }
            }
        } catch (error) {
            console.log("Geocode error:", error);
        }

        return null;
    };

    // Suggested destinations.
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

    const isQueryActive = search.trim().length > 1;

    const listData: ListItem[] = isQueryActive
        ? results
        : rides;

    // Field styling.
    const fieldBackground = (isActive: boolean) =>
        isActive
            ? isDark
                ? "#111111"
                : "#FFFFFF"
            : isDark
              ? "#202020"
              : "#a9a9a933";

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
        : "#000000";

    // Render one location field.
    const renderLocationField = (
        field: "pickup" | "destination",
        label: "From" | "To",
        selectedValue: string,
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
            <View className="mb-3">
                <View
                    style={{
                        backgroundColor:
                            fieldBackground(isActive),
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
                                        fontFamily:
                                            "GoogleSansRegular",
                                    }}
                                >
                                    {label}
                                </Animated.Text>

                                <TextInput
                                    ref={
                                        field === "pickup"
                                            ? pickupInputRef
                                            : destinationInputRef
                                    }
                                    value={fieldSearch}
                                    onChangeText={onChangeSearch}
                                    autoCorrect={false}
                                    spellCheck={false}
                                    placeholder=""
                                    selectionColor={fieldTextColor}
                                    autoCapitalize="words"
                                    returnKeyType="search"
                                    style={{
                                        color: fieldTextColor,
                                        fontFamily:
                                            "GoogleSansRegular",
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
                                        searchRequestId.current += 1;
                                        setResults([]);
                                        setIsSearching(false);

                                        // Keep the current field active
                                        // and leave the keyboard open.
                                        requestAnimationFrame(() => {
                                            if (field === "pickup") {
                                                pickupInputRef.current?.focus();
                                            } else {
                                                destinationInputRef.current?.focus();
                                            }
                                        });
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
                                name={
                                    label === "From"
                                        ? "hand-left"
                                        : "flag"
                                }
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
            </View>
        );
    };

    return (
        <View
            style={{
                backgroundColor: isDark
                    ? "#000000"
                    : "#F5F7FA",
            }}
            className="flex-1"
        >
            {/* Fixed location fields.
                They remain mounted while the keyboard is open. */}
            <View className="px-5 pt-5">
                {renderLocationField(
                    "pickup",
                    "From",
                    pickupPoint,
                    pickupLabelAnim,
                    pickupSearch
                )}

                {renderLocationField(
                    "destination",
                    "To",
                    destinationPoint,
                    destinationLabelAnim,
                    destinationSearch
                )}
            </View>

            {/* Keep the virtualized list separate from the fields. */}
            <View className="flex-1">
                <FlashList
                    style={{ flex: 1 }}
                    data={listData}
                    contentContainerStyle={{
                        paddingBottom: 120,
                    }}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    getItemType={(item) => item.type}
                    keyExtractor={(item, index) =>
                        item.type === "geo"
                            ? `geo-${item.geometry.coordinates[0]}-${item.geometry.coordinates[1]}-${index}`
                            : `ride-${item.id}`
                    }
                    ListHeaderComponent={
                        <View className="px-6 pb-4 mt-4">
                            <Text className="self-start text-secondaryBlack dark:text-general bg-secondaryBlack/10 dark:bg-tertiaryWhite/20 px-3 py-1.5 rounded-full font-GoogleSansMedium text-base">
                                {isQueryActive
                                    ? "Search Results"
                                    : "Suggested Destinations"}
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                            <PaginateSuggestedDestination />
                    }
                    renderItem={({ item }) => {
                        // Photon search result
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
                                    className="py-4 px-6 flex-row items-center"
                                >
                                    <Ionicons
                                        name="location"
                                        size={24}
                                        color={
                                            isDark
                                                ? "#FFFFFF"
                                                : "#000000"
                                        }
                                    />

                                    <View className="ml-3 flex-1">
                                        <Text className="font-GoogleSansMedium text-lg leading-5 text-secondaryBlack dark:text-general">
                                            {name}
                                        </Text>

                                        {subtitle ? (
                                            <Text className="text-secondaryGray dark:text-tertiaryGray leading-4 text-sm">
                                                {subtitle}
                                            </Text>
                                        ) : null}

                                        <View className="w-[90%] bg-tertiaryGray/30 h-[0.8px] mt-2" />
                                    </View>
                                </Pressable>
                            );
                        }

                        // Suggested ride destination
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

                                    if (!pickupPoint) {
                                        openField("pickup");
                                        return;
                                    }

                                    setIsProcessing(true);

                                    try {
                                        setDestinationPoint(
                                            ride.destination
                                        );

                                        setDestinationSearch("");
                                        setResults([]);
                                        setActiveField(null);

                                        pickupInputRef.current?.blur();
                                        destinationInputRef.current?.blur();

                                        const coords =
                                            await geocodePlaceName(
                                                ride.destination
                                            );

                                        if (coords) {
                                            setDestinationCoords(coords);
                                        } else {
                                            setDestinationCoords(null);
                                        }

                                        goNextIfReady(
                                            undefined,
                                            ride.destination
                                        );
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }}
                                className="px-7 py-5 flex-row justify-between items-center"
                            >
                                <Ionicons
                                    name="flag"
                                    size={20}
                                    color={
                                        isDark
                                            ? "#E9EAED"
                                            : "#20202088"
                                    }
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

            <KeyboardToolbar />
        </View>
    );
};

export default Index;

