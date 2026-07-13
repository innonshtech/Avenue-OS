const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Altering User role column to text...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "role" TYPE text;`);
    console.log("Successfully altered column type!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
