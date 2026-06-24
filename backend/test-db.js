const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.passwordResetToken.create({
      data: {
        email: 'test@example.com',
        token: 'test1234',
        expiresAt: new Date()
      }
    });
    console.log('Success creating token');
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
main();
