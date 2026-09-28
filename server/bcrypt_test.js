// import bcrypt from "bcrypt";

// const plain = "Rohullah@1122";
// const stored = "$2b$10$ACoeQ3641UqPO88gEF8qIefSr7swiodoLrn0lIU.tCcg7V.arvDue";

// const test = async () => {
//   const match = await bcrypt.compare(plain, stored);
//   console.log("Matches:", match);
// };

// test();


import bcrypt from 'bcrypt';

const plainPassword = 'Rohullah@1122';
const saltRounds = 10;

const hashPassword = async () => {
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  console.log("Hashed password:", hashed);
};

hashPassword();
