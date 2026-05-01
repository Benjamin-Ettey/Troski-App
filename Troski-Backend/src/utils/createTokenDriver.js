const createTokenDriver = (driver) => {
  return {
    name: driver.name,
    driverId: driver._id,
    phoneNumber: driver.phoneNumber,
    role: driver.role,
    vehicle: driver.vehicle,
  };
};

module.exports = createTokenDriver;
