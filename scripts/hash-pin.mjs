import bcrypt from "bcryptjs";

const pin = process.argv[2];

if (!pin || !/^\d{4,8}$/.test(pin)) {
  console.error("استخدم: npm run hash-pin -- 1234");
  process.exit(1);
}

const hash = await bcrypt.hash(pin, 12);
console.log("\nADMIN_PIN_HASH=");
console.log(hash);
