import prisma from './prisma';

let lastUpdateRun = 0;
const THROTTLE_MS = 60000; // 1 minute

export const autoUpdateTargetStatuses = async () => {
  const now = new Date();
  
  if (now.getTime() - lastUpdateRun < THROTTLE_MS) {
    return; // Skip if run recently
  }
  
  try {
    // 1. PLANNED -> ACTIVE (start date has arrived, and end date not passed)
    await prisma.target.updateMany({
      where: {
        status: 'PLANNED',
        startDate: { lte: now },
        endDate: { gte: now }
      },
      data: { status: 'ACTIVE' }
    });

    // 2. ACTIVE or PLANNED -> COMPLETED (end date has passed)
    await prisma.target.updateMany({
      where: {
        status: { in: ['PLANNED', 'ACTIVE'] },
        endDate: { lt: now }
      },
      data: { status: 'COMPLETED' }
    });
    
    lastUpdateRun = now.getTime();
  } catch (error) {
    console.error('Error auto-updating target statuses:', error);
  }
};
