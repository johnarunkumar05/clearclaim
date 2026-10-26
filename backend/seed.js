/**
 * Seeds demo staff accounts (verifier, approver, finance, admin) plus one
 * sample policyholder, so you can log in and exercise the whole workflow
 * without registering each role by hand.
 *
 * Run with: node seed.js
 */
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const demoUsers = [
  { name: 'Asha Rao', email: 'policyholder@demo.com', password: 'password123', role: 'policyholder', phone: '9000000001' },
  { name: 'Vikram Nair', email: 'verifier@demo.com', password: 'password123', role: 'verifier', phone: '9000000002' },
  { name: 'Meera Iyer', email: 'approver@demo.com', password: 'password123', role: 'approver', phone: '9000000003' },
  { name: 'Rahul Shah', email: 'finance@demo.com', password: 'password123', role: 'finance', phone: '9000000004' },
  { name: 'Admin User', email: 'admin@demo.com', password: 'password123', role: 'admin', phone: '9000000005' },
];

const run = async () => {
  await connectDB();

  for (const u of demoUsers) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`Skipping ${u.email} (already exists)`);
      continue;
    }
    await User.create(u);
    console.log(`Created ${u.role}: ${u.email} / password123`);
  }

  console.log('\nSeed complete. Login with any of the emails above using password: password123');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
