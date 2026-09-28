import "dotenv/config";
import mongoose from "mongoose";

// Tests run against an ISOLATED database on the same cluster as MONGO_URL.
// A separate name means we never read or write the real "troski" data, and a
// hard guard refuses any destructive op unless we're truly on this DB.
const TEST_DB_NAME = "troski_test";

const buildTestUri = (): string => {
  const base = process.env.MONGO_URL;
  if (!base) {
    throw new Error("MONGO_URL is not set — cannot run integration tests");
  }
  const url = new URL(base);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
};

const assertTestDb = (): void => {
  if (mongoose.connection.name !== TEST_DB_NAME) {
    throw new Error(
      `Safety stop: connected DB is "${mongoose.connection.name}", not "${TEST_DB_NAME}"`,
    );
  }
};

export const connectTestDb = async (): Promise<void> => {
  await mongoose.connect(buildTestUri());
  // If we somehow landed anywhere other than the test DB, bail immediately
  // before any test data is written.
  if (mongoose.connection.name !== TEST_DB_NAME) {
    const landed = mongoose.connection.name;
    await mongoose.disconnect();
    throw new Error(`Refusing to run tests against non-test DB "${landed}"`);
  }
};

export const clearDb = async (): Promise<void> => {
  assertTestDb();
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDb = async (): Promise<void> => {
  assertTestDb();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};
