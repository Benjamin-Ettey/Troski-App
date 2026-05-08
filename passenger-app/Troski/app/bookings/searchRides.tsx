import {View, Text, TextInput, Pressable, Image, FlatList, TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import {Ionicons} from "@expo/vector-icons";

const SearchRides = () => {
    const [swap, setSwap] = useState(true);

    const data = [
        {id: 1, destination: "Madina Station", kilometers: "2km", area: "Madina, Accra", passengercount: 8},
        {id: 2, destination: "Circle", kilometers: "8km", area: "Circle, Accra", passengercount: 2},
        {id: 3, destination: "Kasoa Market", kilometers: "15km", area: "Kasoa Road", passengercount: 10},
        {id: 4, destination: "Kotoka Internal Airport", kilometers: "9km", area: "10min", passengercount: 20},
        {id: 5, destination: "Madina Market", kilometers: "10km", area: "Madina, Accra", passengercount: 8},
        {id: 6, destination: "Tarkwa", kilometers: "8km", area: "Tarkwa Road", passengercount: 2},
        {id: 7, destination: "Adenta", kilometers: "15km", area: "Adenta, OffTown", passengercount: 10},
        {id: 8, destination: "Tema Station", kilometers: "0.5km", area: "Tema Road", passengercount: 20},
        {id: 9, destination: "Mallam Junction", kilometers: "10km", area: "Mallam, Accra", passengercount: 8},
        {id: 10, destination: "Offsite", kilometers: "8km", area: "Kasoa, Road", passengercount: 2},
        {id: 11, destination: "Amasaman", kilometers: "15km", area: "Amasaman Road", passengercount: 10},
    ]


    return (
        <View style={{ flex: 1}} className="w-full bg-general">
            <View style={{ paddingHorizontal: 16, paddingBottom: 16}} className="w-full flex flex-row justify-between items-center">

                {swap?
                    <>
                    <View style={{}} className="flex-1 flex flex-col justify-center items-center gap-2">

                        <View style={{ paddingHorizontal: 10, height: 48}} className="w-full border rounded-xl border-tertiaryGray  flex flex-row justify-between items-center">

                            <Ionicons name="radio-button-on" size={24} color="#3B82F6"/>
                            <TextInput
                                placeholder="Pickup point"
                                style={{ flex: 1, paddingLeft: 10,}}
                                className="font-medium text-secondaryGray font-GoogleSansRegular w-full py-4  rounded-xl "

                            />
                            <Ionicons name="apps-outline" size={24} color="#a9a9a9"/>

                        </View>
                        <View style={{ paddingHorizontal: 10, height: 48}} className="w-full border rounded-xl border-tertiaryGray  flex flex-row justify-between items-center">

                            <TextInput
                                placeholder="Destination"
                                style={{ flex: 1, paddingLeft: 10,}}
                                className="font-medium text-secondaryGray font-GoogleSansRegular w-full py-4  rounded-xl "

                            />
                            <Ionicons name="apps-outline" size={24} color="#a9a9a9"/>
                        </View>

                    </View>

                        <View style={{ width: "10%", height: 100, gap: 25}} className="flex justify-center items-center">
                            <TouchableOpacity >
                                <Ionicons  name="add" size={24} color="black"/>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={()=> setSwap(false)} >
                                <Ionicons  name="swap-vertical" size={24} color="black"/>
                            </TouchableOpacity>

                        </View>


                    </>
                    :


                    <>
                    <View className="flex-1 flex flex-col justify-center items-center gap-2">


                        <View style={{ paddingHorizontal: 10, height: 48}} className="w-full border rounded-xl border-tertiaryGray  flex flex-row justify-between items-center">

                            <TextInput
                                placeholder="Destination"
                                style={{ flex: 1, paddingLeft: 10,}}
                                className="font-medium text-secondaryGray font-GoogleSansRegular w-full py-4  rounded-xl "

                            />
                            <Ionicons name="apps-outline" size={24} color="#a9a9a9"/>
                        </View>


                        <View style={{ paddingHorizontal: 10, height: 48}} className="w-full border rounded-xl border-tertiaryGray  flex flex-row justify-between items-center">

                            <Ionicons name="radio-button-on" size={24} color="#3B82F6"/>
                            <TextInput
                                    placeholder="Pickup point"
                                style={{ flex: 1, paddingLeft: 10,}}
                                className="font-medium text-secondaryGray font-GoogleSansRegular w-full py-4  rounded-xl "

                            />
                            <Ionicons name="apps-outline" size={24} color="#a9a9a9"/>
                        </View>

                    </View>

                        <View style={{ width: "10%", height: 100, gap: 25}} className="flex justify-center items-center">
                            <TouchableOpacity >
                                <Ionicons  name="add" size={24} color="black"/>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={()=> setSwap(true)} >
                                <Ionicons  name="swap-vertical" size={24} color="black"/>
                            </TouchableOpacity>

                        </View>
                    </>

                }


            </View>


            <View style={{paddingLeft: 16}} className="w-full flex-1">

            <FlatList
                numColumns={1}
                showsVerticalScrollIndicator={true}
                data={data || []}
                keyExtractor={(item)=>item.id.toString()}
                renderItem={({item})=>{
                    return (
                        <>
                        <Pressable
                            style={{height: 72, borderRadius: 24, paddingLeft: 20, paddingRight: 20, gap: 24}}
                            className="w-full flex flex-row justify-between items-center">
                            <View>
                                <Ionicons name="arrow-up-right-box-outline" size={16}/>
                            </View>


                            <View
                                style={{flex: 1, gap: 2}}
                                className="flex flex-col justify-center items-center ">
                                <View className="flex flex-row justify-start items-center w-full gap-2">
                                    <Text className="text-xl font-GoogleSansRegular">
                                        {item.destination}
                                    </Text>

                                </View>

                                <View className="w-full flex flex-row gap-2 justify-start items-center ">
                                    <Text
                                        style={{paddingHorizontal: 4, paddingVertical: 1, fontSize: 10}}
                                        className=" text-secondaryGray font-GoogleSansRegular rounded-full">{item.area}</Text>

                                    <View
                                        style={{gap: 2}}
                                        className="flex flex-row items-center ">
                                        <Ionicons name="person" size={10} color="gray"/>
                                        <Text className="font-GoogleSansRegular" style={{fontSize: 12}}>{item.passengercount}</Text>
                                    </View>

                                </View>
                            </View>

                            <View
                                style={{width: 84, height: 32, paddingHorizontal: 2}}
                                className="rounded-full  flex justify-center items-end">
                                <Text numberOfLines={1} className="font-GoogleSansRegular text-secondaryGray text-sm">{item.kilometers}</Text>
                            </View>
                        </Pressable>
                            <View className="w-full flex justify-center items-end">
                                <View style={{height: 1, backgroundColor: "#e4e4e488", width: "85%"}} />
                            </View>
                    </>
                    )
                }}/>
            </View>

        </View>
    )
}
export default SearchRides
