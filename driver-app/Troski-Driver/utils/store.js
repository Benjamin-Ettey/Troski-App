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
    setDriverEmail: (driveremail) => set({driveremail}),
    setDriverLicenseID: (driverlicenseid) => set({driverlicenseid}),
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



}))