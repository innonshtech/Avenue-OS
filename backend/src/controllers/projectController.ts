import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { autoUpdateProjectStatuses } from '../utils/projectUpdater';

export const getProjects = async (req: Request, res: Response) => {
  try {
    await autoUpdateProjectStatuses();
    
    const user = req.user;
    const query: any = { isArchived: false };
    if (user && user.role !== 'PRODUCT_MANAGER') {
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
        sprints: true,
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
