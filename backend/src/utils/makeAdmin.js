import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";

const makeUserAdmin = async () => {
  try {
    const email = process.argv[2];
    // optional second arg: 'admin' (default) or 'user' / 'remove' to demote
    const action = (process.argv[3] || "admin").toLowerCase();

    if (!email) {
      console.error("Please provide an email address");
      console.log("Usage: node src/utils/makeAdmin.js <email>");
      process.exit(1);
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      console.error("Missing MONGODB_URI (or MONGO_URI) environment variable");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to database");

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    if (action === "admin") {
      user.role = "admin";
      await user.save();
      console.log(`✅ Successfully made ${user.fullName} (${user.email}) an admin`);
    } else if (action === "user" || action === "remove" || action === "demote") {
      user.role = "user";
      await user.save();
      console.log(`✅ Successfully removed admin role from ${user.fullName} (${user.email})`);
    } else {
      console.error(`Unknown action '${action}'. Use 'admin' or 'user' (or 'remove').`);
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

makeUserAdmin();

