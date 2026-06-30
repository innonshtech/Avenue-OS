import { PrismaClient, UserRole, ProjectStatus, StageStatus, TaskStatus, TaskPriority, RFISeverity, RFIType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { name: "Sushil", email: "sushil@avenue.com", password: "sushil123", role: UserRole.PROJECT_MANAGER, department: "Project Management", avatar: "https://i.pravatar.cc/150?u=sushil" },
  { name: "Sagar", email: "sagar@avenue.com", password: "sagar123", role: UserRole.ENGINEER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=sagar" }
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
  const sushil = createdUsers["Sushil"];
  const sagar = createdUsers["Sagar"];

  if (!sushil || !sagar) {
    console.error("Users Sushil or Sagar not found, skipping mock data.");
    return;
  }

  console.log("Seeding mock projects...");
  const projectData = {
    key: "SPS-MOCK",
    name: "Smart Parking System",
    description: "IoT based smart parking management.",
    status: ProjectStatus.ACTIVE,
    ownerId: sushil.id,
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
      { projectId: project.id, userId: sushil.id, role: "LEAD" },
      { projectId: project.id, userId: sagar.id, role: "MEMBER" }
    ],
    skipDuplicates: true
  });

  console.log("Seeding mock project stages...");
  const stage1 = await prisma.stage.create({
    data: {
      name: "Framing Stage",
      goal: "Setup basic structural framing design",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: StageStatus.ACTIVE,
      projectId: project.id,
    }
  });

  // Stage Members
  await prisma.stageMember.createMany({
    data: [
      { stageId: stage1.id, userId: sushil.id },
      { stageId: stage1.id, userId: sagar.id }
    ],
    skipDuplicates: true
  });

  console.log("Seeding mock tasks...");
  const tasks = [
    { key: "SPSM-1", title: "Setup Structural Framing Plan", description: "Create initial layout", type: "DESIGN", status: TaskStatus.DONE, priority: TaskPriority.HIGH, storyPoints: 3, drawingNumber: "DRW-F-001", revisionNumber: "R0", projectId: project.id, stageId: stage1.id, assigneeId: sagar.id, creatorId: sushil.id },
    { key: "SPSM-2", title: "Drafting Footer Reinforcement Details", description: "RCC details for footing", type: "DRAFTING", status: TaskStatus.INTERNAL_REVIEW, priority: TaskPriority.MEDIUM, storyPoints: 5, drawingNumber: "DRW-D-002", revisionNumber: "R1", projectId: project.id, stageId: stage1.id, assigneeId: sagar.id, creatorId: sushil.id },
    { key: "SPSM-3", title: "Analyze Framing Loading Calculations", description: "STAAD Pro load modeling", type: "ANALYSIS", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, storyPoints: 5, drawingNumber: "DRW-A-003", revisionNumber: "R0", projectId: project.id, stageId: stage1.id, assigneeId: sushil.id, creatorId: sagar.id },
    { key: "SPSM-4", title: "RCC Design of Columns", description: "Column size finalization", type: "DESIGN", status: TaskStatus.PENDING, priority: TaskPriority.URGENT, storyPoints: 8, drawingNumber: "DRW-C-004", revisionNumber: "R0", projectId: project.id, stageId: stage1.id, assigneeId: sagar.id, creatorId: sushil.id },
    { key: "SPSM-5", title: "Review Soil Strata Reports", description: "Check geotechnical reports", type: "REVIEW", status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, storyPoints: 3, drawingNumber: "DRW-R-005", revisionNumber: "R0", projectId: project.id, stageId: stage1.id, assigneeId: sagar.id, creatorId: sagar.id },
    { key: "SPSM-6", title: "Site Inspection for Column Rebar", description: "Check site column spacing", type: "SITE_CHECK", status: TaskStatus.PENDING, priority: TaskPriority.HIGH, storyPoints: 5, drawingNumber: "DRW-S-006", revisionNumber: "R0", projectId: project.id, stageId: stage1.id, assigneeId: sagar.id, creatorId: sushil.id }
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
      userId: sagar.id,
      content: "I have started working on the STAAD load analysis.",
    }
  });

  console.log("Seeding mock progress reports...");
  await prisma.progressReport.create({
    data: {
      date: new Date(),
      yesterday: "Worked on framing layout",
      today: "Starting loading analysis model",
      blockers: "Waiting on architectural drawing updates",
      userId: sagar.id,
      stageId: stage1.id,
    }
  });
  await prisma.progressReport.create({
    data: {
      date: new Date(),
      yesterday: "Checked site dimensions",
      today: "Reviewing calculations",
      blockers: "None",
      userId: sushil.id,
      stageId: stage1.id,
    }
  });

  console.log("Seeding mock RFIs...");
  await prisma.rFI.create({
    data: {
      description: "Discrepancy in center-line dimensions from grid lines",
      severity: RFISeverity.HIGH,
      type: RFIType.ARCHITECTURAL_CLARIFICATION,
      taskId: createdTasks["SPSM-2"].id,
      reporterId: sagar.id,
    }
  });

  console.log("Seeding mock feedback...");
  await prisma.feedback.create({
    data: {
      content: "Stage framing layout completed on time.",
      wentWell: "Good communication with draftsman",
      wentWrong: "Slight delay in receiving site reports",
      userId: sagar.id,
      stageId: stage1.id,
    }
  });

  console.log("Seeding mock performance metrics...");
  await prisma.teamPerformanceMetric.create({
    data: {
      userId: sagar.id,
      stageId: stage1.id,
      assignedTasks: 3,
      completedTasks: 1,
      delayedTasks: 0,
      rfisRaised: 1,
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
      createdById: sushil.id,
    }
  });

  await prisma.chatMember.createMany({
    data: [
      { channelId: channel.id, userId: sushil.id },
      { channelId: channel.id, userId: sagar.id }
    ],
    skipDuplicates: true
  });

  await prisma.chatMessage.create({
    data: {
      channelId: channel.id,
      senderId: sushil.id,
      content: "Welcome to the SPS project channel!",
      messageType: "TEXT",
    }
  });
  
  await prisma.chatMessage.create({
    data: {
      channelId: channel.id,
      senderId: sagar.id,
      content: "Thanks Sushil! Ready to start design calculations.",
      messageType: "TEXT",
    }
  });

  console.log('Seed completed successfully with comprehensive mock data for Sushil and Sagar!');
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
