import { PrismaClient, UserRole, ProjectStatus, SprintStatus, TaskStatus, TaskPriority, BlockerSeverity, BlockerType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { name: "Saket", email: "saket.innonsh@gmail.com", password: "saket123", role: UserRole.PRODUCT_MANAGER, department: "Product Management", avatar: "https://i.pravatar.cc/150?u=saket" },
  { name: "Chetana", email: "chetana.innonsh@gmail.com", password: "chetana123", role: UserRole.DEVELOPER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=chetana" },
  { name: "Lokeek", email: "lokeek.innonsh@gmail.com", password: "lokeek123", role: UserRole.DEVELOPER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=lokeek" },
  { name: "Vaibhav", email: "vaibhav.innonsh@gmail.com", password: "vaibhav123", role: UserRole.DEVELOPER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=vaibhav" },
  { name: "Aniket", email: "aniket.innonsh@gmail.com", password: "aniket123", role: UserRole.DEVELOPER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=aniket" },
  { name: "Tasmiya Shaikh", email: "tasmiya.shaikh@innonsh.com", password: "tasmiya123", role: UserRole.MARKETING, department: "Marketing", avatar: "https://i.pravatar.cc/150?u=tasmiya" },
  { name: "Reshma", email: "reshma.innonsh@gmail.com", password: "reshma123", role: UserRole.MARKETING, department: "Marketing", avatar: "https://i.pravatar.cc/150?u=reshma" },
  { name: "Nikheel", email: "nikheel.innonsh@gmail.com", password: "nikheel123", role: UserRole.ADMIN, department: "Executive", avatar: "https://i.pravatar.cc/150?u=nikheel" }
];

async function main() {
  console.log('Starting seed...');

  // 1. Seed Users
  const createdUsers: Record<string, any> = {};
  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
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
    createdUsers[u.name] = user;
  }
  const saket = createdUsers["Saket"];
  const lokeek = createdUsers["Lokeek"];

  if (!saket || !lokeek) {
    console.error("Users Saket or Lokeek not found, skipping mock data.");
    return;
  }

  console.log("Seeding mock projects...");
  const projectData = {
    key: "SPS-MOCK",
    name: "Smart Parking System",
    description: "IoT based smart parking management.",
    status: ProjectStatus.ACTIVE,
    ownerId: saket.id,
    startDate: new Date(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  const project = await prisma.project.upsert({
    where: { key: projectData.key },
    update: projectData,
    create: projectData
  });

  // Project Members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: saket.id, role: "LEAD" },
      { projectId: project.id, userId: lokeek.id, role: "MEMBER" }
    ],
    skipDuplicates: true
  });

  console.log("Seeding mock sprints...");
  const sprint1 = await prisma.sprint.create({
    data: {
      name: "SPS Sprint 1",
      goal: "Setup basic infrastructure and authentication",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: SprintStatus.ACTIVE,
      projectId: project.id,
    }
  });

  // Sprint Members
  await prisma.sprintMember.createMany({
    data: [
      { sprintId: sprint1.id, userId: saket.id },
      { sprintId: sprint1.id, userId: lokeek.id }
    ],
    skipDuplicates: true
  });

  console.log("Seeding mock tasks...");
  const tasks = [
    { key: "SPSM-1", title: "Setup PostgreSQL Database", description: "Initialize Prisma", type: "TASK", status: TaskStatus.DONE, priority: TaskPriority.HIGH, storyPoints: 3, projectId: project.id, sprintId: sprint1.id, assigneeId: lokeek.id, creatorId: saket.id },
    { key: "SPSM-2", title: "Build Auth Login Page", description: "Create SignInPage.tsx", type: "STORY", status: TaskStatus.IN_REVIEW, priority: TaskPriority.MEDIUM, storyPoints: 5, projectId: project.id, sprintId: sprint1.id, assigneeId: lokeek.id, creatorId: saket.id },
    { key: "SPSM-3", title: "Configure Zustand Stores", description: "Setup state management", type: "TASK", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, storyPoints: 5, projectId: project.id, sprintId: sprint1.id, assigneeId: saket.id, creatorId: lokeek.id },
    { key: "SPSM-4", title: "DND Kit Kanban Board", description: "Implement drag and drop", type: "STORY", status: TaskStatus.TODO, priority: TaskPriority.URGENT, storyPoints: 8, projectId: project.id, sprintId: sprint1.id, assigneeId: lokeek.id, creatorId: saket.id },
    { key: "SPSM-5", title: "Review Architecture", description: "Review system architecture", type: "TASK", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, storyPoints: 3, projectId: project.id, sprintId: sprint1.id, assigneeId: saket.id, creatorId: lokeek.id }
  ];

  const createdTasks: Record<string, any> = {};
  for (const t of tasks) {
    createdTasks[t.key] = await prisma.task.upsert({
      where: { key: t.key },
      update: t,
      create: t,
    });
  }

  console.log("Seeding mock comments...");
  await prisma.comment.create({
    data: {
      taskId: createdTasks["SPSM-3"].id,
      userId: lokeek.id,
      content: "I have started working on the Zustand stores configuration.",
    }
  });

  console.log("Seeding mock daily standups...");
  await prisma.dailyStandup.create({
    data: {
      date: new Date(),
      yesterday: "Worked on DB setup",
      today: "Working on Auth login page",
      blockers: "None",
      userId: lokeek.id,
      sprintId: sprint1.id,
    }
  });
  await prisma.dailyStandup.create({
    data: {
      date: new Date(),
      yesterday: "Reviewed PRs",
      today: "Configuring Zustand",
      blockers: "None",
      userId: saket.id,
      sprintId: sprint1.id,
    }
  });

  console.log("Seeding mock blockers...");
  await prisma.blocker.create({
    data: {
      description: "CORS error on login API",
      severity: BlockerSeverity.HIGH,
      type: BlockerType.TECHNICAL,
      taskId: createdTasks["SPSM-2"].id,
      reporterId: lokeek.id,
    }
  });

  console.log("Seeding mock feedback...");
  await prisma.feedback.create({
    data: {
      content: "Sprint planning went well.",
      wentWell: "Good communication",
      wentWrong: "Slight delay in starting",
      userId: lokeek.id,
      sprintId: sprint1.id,
    }
  });

  console.log("Seeding mock performance metrics...");
  await prisma.teamPerformanceMetric.create({
    data: {
      userId: lokeek.id,
      sprintId: sprint1.id,
      assignedTasks: 3,
      completedTasks: 1,
      delayedTasks: 0,
      blockersRaised: 1,
      avgCompletionTime: 4.5,
      standupConsistency: 100.0,
      utilizationRate: 80.0,
    }
  });

  console.log("Seeding mock chat channels & messages...");
  const channel = await prisma.chatChannel.create({
    data: {
      name: "sps-general",
      description: "General discussion for SPS project",
      type: "PROJECT",
      projectId: project.id,
      createdById: saket.id,
    }
  });

  await prisma.chatMember.createMany({
    data: [
      { channelId: channel.id, userId: saket.id },
      { channelId: channel.id, userId: lokeek.id }
    ],
    skipDuplicates: true
  });

  await prisma.chatMessage.create({
    data: {
      channelId: channel.id,
      senderId: saket.id,
      content: "Welcome to the SPS project channel!",
      messageType: "TEXT",
    }
  });
  
  await prisma.chatMessage.create({
    data: {
      channelId: channel.id,
      senderId: lokeek.id,
      content: "Thanks Saket! Ready to start.",
      messageType: "TEXT",
    }
  });

  console.log('Seed completed successfully with comprehensive mock data for Saket and Lokeek!');
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
