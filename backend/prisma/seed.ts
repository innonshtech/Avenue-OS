import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { name: "Sushil", email: "sushil@avenue.com", password: "sushil123", role: UserRole.PROJECT_MANAGER, department: "Project Management", avatar: "https://i.pravatar.cc/150?u=sushil" },
  { name: "Sagar", email: "sagar@avenue.com", password: "sagar123", role: UserRole.ENGINEER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=sagar" }
];

async function main() {
  console.log('Starting seed...');

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        ...u,
        password: hashedPassword,
      },
      create: {
        ...u,
        password: hashedPassword,
      },
    });
  }

  console.log("Seed completed successfully with only User data for Sushil and Sagar!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
