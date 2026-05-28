import {create} from "zustand"

export const useAppStore = create((set)=> ({

    driverfullname: '',
    drivernumber: '',
    driverpin: '',
    driveremail: '',
    driverlicenseid: '',
    ghanacardnumber: '',
    ghanacardphoto: '',
    driverlicensephoto: '',
    licenseexpirydate: '',
    city: '',
    driverOtpEndTime: null,


    setDriverFullName: (driverfullname) => set({driverfullname}),
    setDriverNumber: (drivernumber) => set({drivernumber}),
    setDriverPin: (driverpin) => set({driverpin}),
    setDriverEmail: (driveremail) => set({driveremail}),
    setDriverLicenseID: (driverlicenseid) => set({driverlicenseid}),
    setGhanaCardNumber: (ghanacardnumber) => set({ghanacardnumber}),
    setGhanaCardPhoto: (ghanacardphoto) => set({ghanacardphoto}),
    setDriverLicensePhoto: (driverlicensephoto) => set({driverlicensephoto}),
    setLicenseExpiryDate: (licenseexpirydate) => set({licenseexpirydate}),
    setCity: (city) => set({city}),
    setDriverOtpEndTime: (time) => set({ driverOtpEndTime: time }),



}))