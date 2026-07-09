import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.performanceMetric.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.rFI.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.target.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  console.log("Successfully cleared all application data (kept user accounts).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
