import {create} from "zustand"

export const useAppStore = create((set)=> ({

    driverfullname: '',
    drivernumber: '',
    driverpin: '',
    driveremail: '',
    city: '',
    driverOtpEndTime: null,


    setDriverFullName: (driverfullname) => set({driverfullname}),
    setDriverNumber: (drivernumber) => set({drivernumber}),
    setDriverPin: (driverpin) => set({driverpin}),
    setDriverEmail: (driveremail) => set({driveremail}),
    setCity: (city) => set({city}),
    setDriverOtpEndTime: (time) => set({ driverOtpEndTime: time }),



}))