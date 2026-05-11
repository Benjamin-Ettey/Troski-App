const formatPhoneNumber = (phoneNumber) => {
  if (phoneNumber.startsWith("0")) {
    return "233" + phoneNumber.slice(1);
  }

  return phoneNumber;
};

const ghanaCapitalCities = {
  GreaterAccra: "Accra",
  Ashanti: "Kumasi",
  Central: "Cape Coast",
  Eastern: "Koforidua",
  Northern: "Tamale",
  UpperEast: "Bolgatanga",
  UpperWest: "Wa",
  Volta: "Ho",
  Western: "Sekondi-Takoradi",
  Bono: "Sunyani",
  BonoEast: "Techiman",
  Ahafo: "Goaso",
  WesternNorth: "Sefwi Wiawso",
  Oti: "Dambai",
  Savannah: "Damongo",
  NorthEast: "Nalerigu",
};

module.exports = {
  formatPhoneNumber,
  ghanaCapitalCities,
};
