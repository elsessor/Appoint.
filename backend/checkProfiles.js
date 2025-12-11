const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  fullName: String,
  profilePic: String,
  email: String,
});

const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB\n');
  
  const users = await User.find({}).select('fullName profilePic email').limit(10);
  
  console.log('Sample users with profile pictures:\n');
  users.forEach(u => {
    console.log(`${u.fullName} (${u.email})`);
    console.log(`  Profile Pic: ${u.profilePic || 'NO PROFILE PIC'}\n`);
  });
  
  const withPics = users.filter(u => u.profilePic).length;
  const withoutPics = users.filter(u => !u.profilePic).length;
  
  console.log(`Users with profile pics: ${withPics}`);
  console.log(`Users without profile pics: ${withoutPics}`);
  
  mongoose.connection.close();
  process.exit(0);
});
