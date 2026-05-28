import prisma from './utils/prisma';
import { autoUpdateProjectStatuses } from './utils/projectUpdater';

async function main() {
  try {
    console.log('Running autoUpdateProjectStatuses...');
    await autoUpdateProjectStatuses();
    console.log('autoUpdateProjectStatuses completed.');

    // Simulate without user
    console.log('Fetching projects (no user context)...');
    const projectsNoUser = await prisma.project.findMany({
      where: { isArchived: false },
      include: {
        members: true,
        owner: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Projects (no user) fetched:', projectsNoUser.length);

    // Simulate with non-PRODUCT_MANAGER user
    console.log('Fetching projects (DEVELOPER user)...');
    const projectsDev = await prisma.project.findMany({
      where: {
        isArchived: false,
        members: {
          some: {
            userId: '526bbc44-08f1-452c-a889-8a2dcd4b31da' // user ID from the logs
          }
        }
      },
      include: {
        members: true,
        owner: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Projects (DEVELOPER) fetched:', projectsDev.length);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
