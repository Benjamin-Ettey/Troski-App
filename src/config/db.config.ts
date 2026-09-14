import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error("MONGO_URL environment variable is not defined");
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected successfully");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Database connection failed: ${error.message}`);
    } else {
      console.error(
        "Database connection failed with an unknown error type:",
        error,
      );
    }
    process.exit(1);
  }
};
