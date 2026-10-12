import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai_document_editor";
  
  try {
    mongoose.set("strictQuery", true);
    // Attempt local or Atlas MongoDB connection with a 3-second timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[Database] MongoDB connected successfully to ${uri}`);
  } catch (error: any) {
    console.warn(`[Database] Local MongoDB service not active on port 27017.`);
    console.log(`[Database] Launching native embedded in-memory MongoDB engine (Zero Docker, Zero setup)...`);

    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create({
        instance: { dbName: "ai_document_editor" },
      });
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Embedded in-memory MongoDB active and connected at: ${memoryUri}`);
    } catch (memError: any) {
      console.error("[Database] Failed to initialize embedded MongoDB engine:", memError.message);
    }
  }
}
