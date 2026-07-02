import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { autoUpdateProjectStatuses } from '../utils/projectUpdater';

export const getProjects = async (req: Request, res: Response) => {
  try {
    await autoUpdateProjectStatuses();
    
    const user = req.user;
    const query: any = { isArchived: false };
    if (user && user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN') {
      query.members = {
        some: {
          userId: user.id
        }
      };
    }

    const projects = await prisma.project.findMany({
      where: query,
      include: {
        members: true,
        owner: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(projects);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: true }
        },
        owner: true,
        stages: true,
        tasks: true,
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { key, name, description, status, ownerId, memberIds, startDate, deadline } = req.body;

    if (deadline) {
      const deadlineDate = new Date(deadline);
      const minDeadlineDate = new Date(Date.now() - 36 * 60 * 60 * 1000);
      if (deadlineDate < minDeadlineDate) {
        return res.status(400).json({ error: 'Project deadline cannot be in the past.' });
      }
    }

    const project = await prisma.project.create({
      data: {
        key,
        name,
        description,
        status: status || 'PLANNING',
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        ownerId,
        members: {
          create: memberIds?.map((userId: string) => ({
            userId,
            role: userId === ownerId ? 'LEAD' : 'MEMBER'
          })) || []
        }
      },
      include: {
        members: true
      }
    });

    // Auto-create Project Chat Channel
    await prisma.chatChannel.create({
      data: {
        name: `${key.toLowerCase()}-general`,
        description: `General discussion for ${name} project`,
        type: 'PROJECT',
        projectId: project.id,
        createdById: ownerId,
      }
    });

    // Auto-generate default project stages and tasks (Project Template Engine)
    const projectStart = startDate ? new Date(startDate) : new Date();
    
    const stageTemplates = [
      {
        name: "Framing",
        goal: "Creating structural framing layout and review phases",
        startOffsetDays: 0,
        endOffsetDays: 5,
        tasks: [
          { title: "Creating Structural Framing", type: "DESIGN" },
          { title: "Internal Review", type: "REVIEW" },
          { title: "External Review (Architect/Client)", type: "REVIEW" }
        ]
      },
      {
        name: "Analysis",
        goal: "Model creation, load calculations and size finalization",
        startOffsetDays: 5,
        endOffsetDays: 10,
        tasks: [
          { title: "Model Creation, DBR, Loading, Member size Finalization", type: "ANALYSIS" }
        ]
      },
      {
        name: "Designing - RCC",
        goal: "Concrete design for footings, columns, plinth-beams, and staircases",
        startOffsetDays: 10,
        endOffsetDays: 20,
        tasks: [
          { title: "Footing Design", type: "DESIGN" },
          { title: "Column Design", type: "DESIGN" },
          { title: "Plinth-Beam Design", type: "DESIGN" },
          { title: "Staircase Design", type: "DESIGN" }
        ]
      },
      {
        name: "Drafting - RCC",
        goal: "Drafting structural construction drawings",
        startOffsetDays: 20,
        endOffsetDays: 25,
        tasks: [
          { title: "Footing Drafting", type: "DRAFTING" },
          { title: "Column Drafting", type: "DRAFTING" }
        ]
      },
      {
        name: "Site Visit",
        goal: "Strata checking and reinforcing layout verification",
        startOffsetDays: 25,
        endOffsetDays: 30,
        tasks: [
          { title: "Strata Checking", type: "SITE_CHECK" },
          { title: "Footing and Column Reinforcement Checking", type: "SITE_CHECK" }
        ]
      }
    ];

    let taskIndex = 1;
    for (const st of stageTemplates) {
      const stageStart = new Date(projectStart);
      stageStart.setDate(stageStart.getDate() + st.startOffsetDays);
      const stageEnd = new Date(projectStart);
      stageEnd.setDate(stageEnd.getDate() + st.endOffsetDays);

      const createdStage = await prisma.stage.create({
        data: {
          name: st.name,
          goal: st.goal,
          startDate: stageStart,
          endDate: stageEnd,
          projectId: project.id,
          status: st.startOffsetDays === 0 ? 'ACTIVE' : 'PLANNED'
        }
      });

      // Auto-create Stage Chat Channel
      await prisma.chatChannel.create({
        data: {
          name: `stage-${st.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          description: `Discussion for ${st.name} stage`,
          type: 'STAGE',
          projectId: project.id,
          stageId: createdStage.id,
          createdById: ownerId,
        }
      });

      for (const t of st.tasks) {
        await prisma.task.create({
          data: {
            key: `${key}-${taskIndex++}`,
            title: t.title,
            type: t.type,
            status: 'PENDING',
            projectId: project.id,
            stageId: createdStage.id,
            creatorId: ownerId
          }
        });
      }
    }

    res.status(201).json(project);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A project with this key already exists.' });
    }
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, memberIds, startDate, deadline } = req.body;

    if (deadline) {
      const deadlineDate = new Date(deadline);
      const minDeadlineDate = new Date(Date.now() - 36 * 60 * 60 * 1000);
      if (deadlineDate < minDeadlineDate) {
        return res.status(400).json({ error: 'Project deadline cannot be in the past.' });
      }
    }

    // First update the core project details
    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        status,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      }
    });

    // If memberIds are provided, we sync them (delete old ones not in list, add new ones)
    if (memberIds && Array.isArray(memberIds)) {
      // Very simple sync approach: delete all current and recreate
      // In production, you might want a more nuanced approach to preserve join table IDs
      await prisma.projectMember.deleteMany({
        where: { projectId: id }
      });

      await prisma.projectMember.createMany({
        data: memberIds.map((userId: string) => ({
          projectId: id,
          userId,
          role: userId === project.ownerId ? 'LEAD' : 'MEMBER'
        }))
      });
    }

    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: { members: true }
    });

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({
      where: { id }
    });
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const archiveProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;
    const project = await prisma.project.update({
      where: { id },
      data: { isArchived }
    });
    res.status(200).json(project);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to archive project' });
  }
};
