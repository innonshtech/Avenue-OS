import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const roles = [
  {
    name: 'ADMIN',
    permissions: [
      'CREATE_PROJECT', 'EDIT_PROJECT', 'DELETE_PROJECT', 'CREATE_TASK', 'ASSIGN_TASK', 'DELETE_TASK', 'RESOLVE_RFI', 'MANAGE_USERS',
      'VIEW_PROJECTS', 'VIEW_TARGETS', 'VIEW_TARGET_REPORTS', 'VIEW_ALL_TASKS', 'VIEW_MY_TASKS', 'VIEW_BOARDS', 'VIEW_CHAT', 'VIEW_PROGRESS_REPORTS', 'VIEW_TIMESHEETS', 'VIEW_ACTIVITY_LOG', 'VIEW_ANALYTICS', 'VIEW_REPORTS', 'VIEW_AUDIT_LOG', 'VIEW_FEEDBACKS', 'VIEW_TEAM', 'VIEW_CALENDAR', 'VIEW_SETTINGS'
    ],
    isSystem: true
  },
  {
    name: 'DIRECTOR',
    permissions: [
      'CREATE_PROJECT', 'EDIT_PROJECT', 'DELETE_PROJECT', 'CREATE_TASK', 'ASSIGN_TASK', 'DELETE_TASK', 'RESOLVE_RFI', 'MANAGE_USERS',
      'VIEW_PROJECTS', 'VIEW_TARGETS', 'VIEW_TARGET_REPORTS', 'VIEW_ALL_TASKS', 'VIEW_MY_TASKS', 'VIEW_BOARDS', 'VIEW_CHAT', 'VIEW_PROGRESS_REPORTS', 'VIEW_TIMESHEETS', 'VIEW_ACTIVITY_LOG', 'VIEW_ANALYTICS', 'VIEW_REPORTS', 'VIEW_AUDIT_LOG', 'VIEW_FEEDBACKS', 'VIEW_TEAM', 'VIEW_CALENDAR', 'VIEW_SETTINGS'
    ],
    isSystem: true
  },
  {
    name: 'ASSOCIATE_DIRECTOR',
    permissions: [
      'CREATE_PROJECT', 'EDIT_PROJECT', 'CREATE_TASK', 'ASSIGN_TASK', 'RESOLVE_RFI',
      'VIEW_PROJECTS', 'VIEW_TARGETS', 'VIEW_TARGET_REPORTS', 'VIEW_ALL_TASKS', 'VIEW_BOARDS', 'VIEW_CHAT', 'VIEW_PROGRESS_REPORTS', 'VIEW_TIMESHEETS', 'VIEW_ACTIVITY_LOG', 'VIEW_ANALYTICS', 'VIEW_REPORTS', 'VIEW_FEEDBACKS', 'VIEW_TEAM', 'VIEW_CALENDAR', 'VIEW_SETTINGS'
    ],
    isSystem: true
  },
  {
    name: 'DESIGN_ENGINEER',
    permissions: [
      'CREATE_TASK', 'RESOLVE_RFI',
      'VIEW_TARGET_REPORTS', 'VIEW_MY_TASKS', 'VIEW_BOARDS', 'VIEW_CHAT', 'VIEW_PROGRESS_REPORTS', 'VIEW_TIMESHEETS', 'VIEW_ACTIVITY_LOG', 'VIEW_FEEDBACKS', 'VIEW_TEAM', 'VIEW_CALENDAR', 'VIEW_SETTINGS'
    ],
    isSystem: true
  },
  {
    name: 'JR_DRAFTSMAN',
    permissions: [
      'VIEW_MY_TASKS', 'VIEW_BOARDS', 'VIEW_CHAT', 'VIEW_PROGRESS_REPORTS', 'VIEW_TIMESHEETS', 'VIEW_ACTIVITY_LOG', 'VIEW_FEEDBACKS', 'VIEW_TEAM', 'VIEW_CALENDAR', 'VIEW_SETTINGS'
    ],
    isSystem: true
  },
  {
    name: 'INTERN',
    permissions: [
      'VIEW_MY_TASKS', 'VIEW_BOARDS', 'VIEW_CHAT', 'VIEW_PROGRESS_REPORTS', 'VIEW_TIMESHEETS', 'VIEW_ACTIVITY_LOG', 'VIEW_FEEDBACKS', 'VIEW_TEAM', 'VIEW_CALENDAR', 'VIEW_SETTINGS'
    ],
    isSystem: true
  },
  { 
    name: 'PROJECT_MANAGER', 
    isSystem: true, 
    permissions: [
      'CREATE_PROJECT', 'EDIT_PROJECT', 'DELETE_PROJECT', 'CREATE_TASK', 'ASSIGN_TASK', 'DELETE_TASK', 'RESOLVE_RFI',
      'VIEW_PROJECTS', 'VIEW_TARGETS', 'VIEW_TARGET_REPORTS', 'VIEW_ALL_TASKS', 'VIEW_MY_TASKS', 'VIEW_BOARDS', 'VIEW_CHAT', 'VIEW_PROGRESS_REPORTS', 'VIEW_TIMESHEETS', 'VIEW_ACTIVITY_LOG', 'VIEW_ANALYTICS', 'VIEW_REPORTS', 'VIEW_FEEDBACKS', 'VIEW_TEAM', 'VIEW_CALENDAR'
    ] 
  },
  { 
    name: 'ENGINEER', 
    isSystem: true, 
    permissions: [
      'CREATE_TASK', 'VIEW_MY_TASKS', 'VIEW_BOARDS', 'VIEW_CHAT', 'VIEW_PROGRESS_REPORTS', 'VIEW_TIMESHEETS', 'VIEW_ACTIVITY_LOG', 'VIEW_TEAM', 'VIEW_CALENDAR'
    ] 
  }
];

const users = [
  { name: "Ankita Naghate", email: "ankitan.avenue@gmail.com", password: "Ankita123", role: "ADMIN", department: "Administration" },
  { name: "Sushil Naghate", email: "sushil.naghate@gmail.com", password: "Sushil123", role: "DIRECTOR", department: "Executive" },
  { name: "Abhijeet Makde", email: "abhijeet.makde@avenue.com", password: "Abhijeet123", role: "ASSOCIATE_DIRECTOR", department: "Management" },
  { name: "Satish Redekar", email: "satish.redekar@avenue.com", password: "Satish123", role: "DESIGN_ENGINEER", department: "Engineering" },
  { name: "Neha Bonde", email: "neha.bonde@avenue.com", password: "Neha123", role: "JR_DRAFTSMAN", department: "Drafting" },
  { name: "Sagar Kolekar", email: "sagar.kolekar@avenue.com", password: "Sagar123", role: "DESIGN_ENGINEER", department: "Engineering" },
  { name: "Naina Mohokar", email: "naina.mohokar@avenue.com", password: "Naina123", role: "INTERN", department: "Engineering" },
  { name: "Sakshi Kale", email: "sakshi.kale@avenue.com", password: "Sakshi123", role: "INTERN", department: "Engineering" },
  { name: "Sharayu Nachane", email: "sharayu.nachane@avenue.com", password: "Sharayu123", role: "INTERN", department: "Engineering" },
  { name: "Adnyesh Pethakar", email: "adnyesh.pethakar@avenue.com", password: "Adnyesh123", role: "INTERN", department: "Engineering" }
];

async function main() {
  console.log('Starting seed...');

  for (const r of roles) {
    await prisma.systemRole.upsert({
      where: { name: r.name },
      update: { permissions: r.permissions },
      create: r,
    });
  }

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        department: u.department,
        password: hashedPassword,
      },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        password: hashedPassword,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
