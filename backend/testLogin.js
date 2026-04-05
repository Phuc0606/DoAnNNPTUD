const mongoose = require('mongoose');
const userModel = require('./schemas/users');
require('./schemas/roles'); // to load role model
let bcrypt = require('bcrypt');
let userController = require('./services/users')

async function test() {
  await mongoose.connect('mongodb://localhost:27017/DACKNHAHANG', {
  });
  let user = await userController.FindUserByUsername('admin');
  console.log("Found user:", user.username, "Role ID:", user.role);
  
  if (bcrypt.compareSync('Admin@123', user.password)) {
      console.log("Password matches");
      user.loginCount = 0;
      await user.save();
      await user.populate('role');
      console.log("Populated user role:", user.role ? user.role.name : "role is null");
  } else {
      console.log("Password doesn't match");
  }
  process.exit(0);
}
test();
