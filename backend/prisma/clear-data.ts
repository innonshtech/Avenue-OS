import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data cleanup (keeping user login credentials)...');

  // 1. Clear self-referential foreign keys first to prevent constraint issues
  console.log('Clearing self-referential relations (comments & chat messages)...');
  try {
    await prisma.comment.updateMany({
      data: { parentCommentId: null }
    });
    console.log('✓ Cleared comment parent-child references.');
  } catch (error) {
    console.warn('Note: Could not clear comment parent-child references:', error);
  }

  try {
    await prisma.chatMessage.updateMany({
      data: { parentMessageId: null }
    });
    console.log('✓ Cleared chat message parent-child references.');
  } catch (error) {
    console.warn('Note: Could not clear chat message parent-child references:', error);
  }

  // 2. Delete from child/dependent tables up to parent tables
  const tables = [
    'pinnedMessage',
    'messageReaction',
    'chatMessage',
    'chatMember',
    'chatChannel',
    'inAppNotification',
    'loginHistory',
    'securityAuditLog',
    'userSession',
    'notificationHistory',
    'activityLog',
    'emailLog',
    'productivitySnapshot',
    'todayFocus',
    'memberSprintStats',
    'auditLog',
    'attachment',
    'notification',
    'retrospectiveComparison',
    'analyticsSnapshot',
    'teamPerformanceMetric',
    'sprintReport',
    'feedback',
    'blocker',
    'dailyStandup',
    'taskActivity',
    'taskSubtask',
    'commentReaction',
    'comment',
    'task',
    'sprintMember',
    'sprint',
    'projectMember',
    'project'
  ];

  for (const table of tables) {
    try {
      console.log(`Clearing table ${table}...`);
      // @ts-ignore
      await prisma[table].deleteMany({});
      console.log(`✓ Cleared table ${table}`);
    } catch (error) {
      console.error(`✗ Error clearing ${table}:`, error);
    }
  }

  console.log('Data cleanup completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
