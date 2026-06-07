import {create} from "zustand"

export const useAppStore = create((set)=> ({

    driverfullname: '',
    drivernumber: '',
    driverpin: '',
    drivertemppin: '',
    driveremail: '',
    driverlicenseid: '',
    ghanacardnumber: '',
    ghanacardphoto: '',
    driverlicensephoto: '',
    driverimage: '',
    licenseexpirydate: '',
    vehicletype: '',
    vehiclenumberplate: '',
    vehiclecolor: '',
    vehiclecapacity: '',
    vehiclephoto: '',
    insurancecertificatephoto: '',
    vehicleregistrationdocumentphoto: '',
    dvlaroadworthyexpirydate: '',
    city: '',
    driverOtpEndTime: null,
    mobilemoneynumber: '',
    bankaccountnumber: '',
    accountname: '',
    hasRegistered: false,
    isLoggedIn: false,


    routes: [{ from: '', to: '' }],

    addRoute: () => set((state) => ({ routes: [...state.routes, { from: '', to: '' }] })),
    updateRoute: (index, field, value) =>
        set((state) => {
            const updated = [...state.routes];
            updated[index][field] = value;
            return {routes: updated};
        }),


    setDriverFullName: (driverfullname) => set({driverfullname}),
    setDriverNumber: (drivernumber) => set({drivernumber}),
    setDriverPin: (driverpin) => set({driverpin}),
    setDriverTempPin: (drivertemppin) => set({drivertemppin}),
    setDriverEmail: (driveremail) => set({driveremail}),
    setDriverLicenseID: (driverlicenseid) => set({driverlicenseid}),
    setDriverImage: (driverimage) => set({driverimage}),
    setGhanaCardNumber: (ghanacardnumber) => set({ghanacardnumber}),
    setGhanaCardPhoto: (ghanacardphoto) => set({ghanacardphoto}),
    setDriverLicensePhoto: (driverlicensephoto) => set({driverlicensephoto}),
    setLicenseExpiryDate: (licenseexpirydate) => set({licenseexpirydate}),
    setVehicleType: (vehicletype) => set({ vehicletype }),
    setVehicleNumberPlate: (vehiclenumberplate) => set({ vehiclenumberplate }),
    setVehicleColor: (vehiclecolor) => set({ vehiclecolor }),
    setVehicleCapacity: (vehiclecapacity) => set({ vehiclecapacity }),
    setVehiclePhoto: (vehiclephoto) => set({ vehiclephoto }),
    setInsuranceCertificatePhoto: (insurancecertificatephoto) => set({ insurancecertificatephoto }),
    setVehicleRegistrationDocumentPhoto: (vehicleregistrationdocumentphoto) => set({ vehicleregistrationdocumentphoto }),
    setDvlaRoadworthyExpiryDate: (dvlaroadworthyexpirydate) => set({ dvlaroadworthyexpirydate }),
    setCity: (city) => set({city}),
    setDriverOtpEndTime: (time) => set({ driverOtpEndTime: time }),
    setMobileMoneyNumber: (mobilemoneynumber) => set({ mobilemoneynumber }),
    setBankAccountNumber: (bankaccountnumber) => set({ bankaccountnumber }),
    setAccountName: (accountname) => set({ accountname }),
    setHasRegistered: (hasRegistered) => set({ hasRegistered}),
    setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn}),


    isOnline: {
        online: true,
    },

    toggleDriverOnline: (key) =>
        set((state) => ({
            isOnline: {
                ...state.isOnline,
                [key]: !state.isOnline[key],
            },
        })),


    drivernotifications: {
        driverRideUpdates: true,
        driverPaymentNotifications: true,
        driverAnnouncements: true,
    },

    toggleDriverNotification: (key) =>
        set((state) => ({
            drivernotifications: {
                ...state.drivernotifications,
                [key]: !state.drivernotifications[key],
            },
        })),


    resetDriverNotifications: () =>
        set({
            drivernotifications: {
                driverRideUpdates: true,
                driverPaymentNotifications: true,
                driverAnnouncements: true,
            },
        }),


    deleteDriverAccount: ()=> set({

        driverRideUpdates: true,
        driverPaymentNotifications: true,
        driverAnnouncements: false,
        driverfullname: '',
        drivernumber: '',
        driverpin: '',
        drivertemppin: '',
        driveremail: '',
        driverlicenseid: '',
        ghanacardnumber: '',
        ghanacardphoto: '',
        driverlicensephoto: '',
        driverimage: '',
        licenseexpirydate: '',
        vehicletype: '',
        vehiclenumberplate: '',
        vehiclecolor: '',
        vehiclecapacity: '',
        vehiclephoto: '',
        insurancecertificatephoto: '',
        vehicleregistrationdocumentphoto: '',
        dvlaroadworthyexpirydate: '',
        city: '',
        mobilemoneynumber: '',
        bankaccountnumber: '',
        accountname: '',


    }),


}))