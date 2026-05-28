import prisma from '../../utils/prisma';

export class SearchService {
  /**
   * Performs a global fuzzy search across tasks, projects, comments, blockers, and standups.
   * Enforces role-based access control (RBAC).
   */
  async globalSearch(userId: string, userRole: string, query: string) {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return { tasks: [], projects: [], comments: [], blockers: [], standups: [] };
    }

    const q = query.trim();

    // 1. Determine which projects this user is allowed to access
    let allowedProjectIds: string[] = [];
    
    if (userRole === 'ADMIN' || userRole === 'PRODUCT_MANAGER') {
      const projects = await prisma.project.findMany({
        select: { id: true }
      });
      allowedProjectIds = projects.map((p) => p.id);
    } else {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId
                }
              }
            }
          ]
        },
        select: { id: true }
      });
      allowedProjectIds = projects.map((p) => p.id);
    }

    // 2. Fetch results across models in parallel
    const [tasks, projects, comments, blockers, standups] = await Promise.all([
      // Tasks Search
      prisma.task.findMany({
        where: {
          projectId: { in: allowedProjectIds },
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { key: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: {
          project: {
            select: { id: true, name: true, key: true }
          },
          assignee: {
            select: { id: true, name: true, avatar: true }
          }
        },
        take: 10
      }),

      // Projects Search
      prisma.project.findMany({
        where: {
          id: { in: allowedProjectIds },
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { key: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: {
          owner: {
            select: { id: true, name: true }
          }
        },
        take: 5
      }),

      // Comments Search
      prisma.comment.findMany({
        where: {
          task: { projectId: { in: allowedProjectIds } },
          content: { contains: q, mode: 'insensitive' }
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          },
          task: {
            select: { id: true, title: true, key: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Blockers Search
      prisma.blocker.findMany({
        where: {
          task: { projectId: { in: allowedProjectIds } },
          description: { contains: q, mode: 'insensitive' }
        },
        include: {
          task: {
            select: { id: true, title: true, key: true, projectId: true }
          }
        },
        take: 5
      }),

      // Daily Standups Search
      prisma.dailyStandup.findMany({
        where: {
          OR: [
            { yesterday: { contains: q, mode: 'insensitive' } },
            { today: { contains: q, mode: 'insensitive' } },
            { blockers: { contains: q, mode: 'insensitive' } }
          ],
          // Devs/marketing can only search their own standups
          ...(userRole !== 'ADMIN' && userRole !== 'PRODUCT_MANAGER' ? { userId } : {})
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    return {
      tasks,
      projects,
      comments,
      blockers,
      standups
    };
  }

  /**
   * Provides quick suggestions/autocomplete for global search input.
   */
  async getSuggestions(userId: string, userRole: string, query: string) {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return [];
    }

    const q = query.trim();

    // 1. Allowed Project IDs
    let allowedProjectIds: string[] = [];
    if (userRole === 'ADMIN' || userRole === 'PRODUCT_MANAGER') {
      const projects = await prisma.project.findMany({ select: { id: true } });
      allowedProjectIds = projects.map((p) => p.id);
    } else {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        },
        select: { id: true }
      });
      allowedProjectIds = projects.map((p) => p.id);
    }

    // 2. Fetch matches for tasks and projects
    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: {
          projectId: { in: allowedProjectIds },
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { key: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: { id: true, title: true, key: true },
        take: 5
      }),
      prisma.project.findMany({
        where: {
          id: { in: allowedProjectIds },
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { key: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: { id: true, name: true, key: true },
        take: 3
      })
    ]);

    // Format suggestions
    const suggestions: Array<{ id: string; title: string; type: 'task' | 'project'; key?: string }> = [
      ...tasks.map(t => ({ id: t.id, title: t.title, type: 'task' as const, key: t.key })),
      ...projects.map(p => ({ id: p.id, title: p.name, type: 'project' as const, key: p.key }))
    ];

    return suggestions;
  }
}

export const searchService = new SearchService();
