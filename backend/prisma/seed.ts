import { PrismaClient, UserRole, ProjectStatus, SprintStatus, TaskStatus, TaskPriority, BlockerSeverity, BlockerType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { name: "Saket", email: "saket.innonsh@gmail.com", password: "saket123", role: UserRole.PRODUCT_MANAGER, department: "Product Management", avatar: "https://i.pravatar.cc/150?u=saket" },
  { name: "Chetana", email: "chetana.innonsh@gmail.com", password: "chetana123", role: UserRole.DEVELOPER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=chetana" },
  { name: "Lokeek", email: "lokeek.innonsh@gmail.com", password: "lokeek123", role: UserRole.DEVELOPER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=lokeek" },
  { name: "Vaibhav", email: "vaibhav.innonsh@gmail.com", password: "vaibhav123", role: UserRole.DEVELOPER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=vaibhav" },
  { name: "Aniket", email: "aniket.innonsh@gmail.com", password: "aniket123", role: UserRole.DEVELOPER, department: "Engineering", avatar: "https://i.pravatar.cc/150?u=aniket" },
  { name: "Yukta", email: "yukta.innonsh@gmail.com", password: "yukta123", role: UserRole.MARKETING, department: "Marketing", avatar: "https://i.pravatar.cc/150?u=yukta" },
  { name: "Reshma", email: "reshma.innonsh@gmail.com", password: "reshma123", role: UserRole.MARKETING, department: "Marketing", avatar: "https://i.pravatar.cc/150?u=reshma" },
  { name: "Naisha", email: "naisha.innonsh@gmail.com", password: "naisha123", role: UserRole.MARKETING, department: "Marketing", avatar: "https://i.pravatar.cc/150?u=naisha" },
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
  const chetana = createdUsers["Chetana"];

  // 2. Seed Projects
  const projectsData = [
    { key: "SPS", name: "Smart Parking System", description: "IoT based smart parking management.", status: ProjectStatus.ACTIVE, ownerId: saket.id },
    { key: "HRMS", name: "HRMS", description: "Internal HR management system.", status: ProjectStatus.ACTIVE, ownerId: saket.id },
    { key: "ERP", name: "ERP Dashboard", description: "Enterprise resource planning portal.", status: ProjectStatus.PLANNING, ownerId: saket.id },
    { key: "CP", name: "Client Portal", description: "External client facing portal.", status: ProjectStatus.ON_HOLD, ownerId: saket.id }
  ];

  const createdProjects: Record<string, any> = {};
  for (const p of projectsData) {
    const proj = await prisma.project.upsert({
      where: { key: p.key },
      update: p,
      create: p,
    });
    createdProjects[p.key] = proj;
  }

  // Assign members to SPS project
  await prisma.projectMember.createMany({
    data: [
      { projectId: createdProjects["SPS"].id, userId: saket.id, role: "LEAD" },
      { projectId: createdProjects["SPS"].id, userId: lokeek.id, role: "MEMBER" },
      { projectId: createdProjects["SPS"].id, userId: chetana.id, role: "MEMBER" },
    ],
    skipDuplicates: true
  });

  // 3. Seed Sprints for SPS
  const sprint1 = await prisma.sprint.create({
    data: {
      name: "SPS Sprint 1",
      goal: "Setup basic infrastructure and authentication",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: SprintStatus.ACTIVE,
      projectId: createdProjects["SPS"].id,
    }
  });

  // 4. Seed Tasks
  const tasks = [
    { key: "SPS-1", title: "Setup PostgreSQL Database", description: "Initialize Prisma and setup schemas", type: "TASK", status: TaskStatus.DONE, priority: TaskPriority.HIGH, storyPoints: 3, projectId: createdProjects["SPS"].id, sprintId: sprint1.id, assigneeId: lokeek.id, creatorId: saket.id },
    { key: "SPS-2", title: "Build Auth Login Page", description: "Create SignInPage.tsx with role selection", type: "STORY", status: TaskStatus.IN_REVIEW, priority: TaskPriority.MEDIUM, storyPoints: 5, projectId: createdProjects["SPS"].id, sprintId: sprint1.id, assigneeId: chetana.id, creatorId: saket.id },
    { key: "SPS-3", title: "Configure Zustand Stores", description: "Setup state management for tasks and sprints", type: "TASK", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, storyPoints: 5, projectId: createdProjects["SPS"].id, sprintId: sprint1.id, assigneeId: lokeek.id, creatorId: saket.id },
    { key: "SPS-4", title: "DND Kit Kanban Board", description: "Implement drag and drop for tasks", type: "STORY", status: TaskStatus.TODO, priority: TaskPriority.URGENT, storyPoints: 8, projectId: createdProjects["SPS"].id, sprintId: sprint1.id, assigneeId: lokeek.id, creatorId: saket.id },
    { key: "SPS-5", title: "Fix API CORS Issue", description: "CORS blocking frontend requests", type: "BUG", status: TaskStatus.TODO, priority: TaskPriority.CRITICAL, storyPoints: 2, projectId: createdProjects["SPS"].id, sprintId: sprint1.id, assigneeId: chetana.id, creatorId: saket.id },
  ];

  for (const t of tasks) {
    await prisma.task.upsert({
      where: { key: t.key },
      update: t,
      create: t,
    });
  }

  console.log('Seed completed successfully!');
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
