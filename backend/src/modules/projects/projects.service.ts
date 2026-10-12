import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(clientId?: string) {
    const projects = await this.prisma.project.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: true,
        assignee: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      summary: project.summary,
      category: project.category,
      priority: project.priority,
      budget: project.budget,
      deadline: project.deadline,
      skills: project.skills,
      status: project.status,
      attachments: project.attachments ?? [],
      client: {
        id: project.client.id,
        name: project.client.name,
        email: project.client.email,
      },
      assignee: project.assignee
        ? {
            id: project.assignee.id,
            name: project.assignee.name,
            email: project.assignee.email,
          }
        : null,
    }));
  }

  async findProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { client: true, assignee: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} was not found.`);
    }

    return project;
  }

  async createProject(dto: {
    title: string;
    summary: string;
    category: string;
    priority: string;
    budget: number;
    deadline: string;
    skills: string[];
    clientId: string;
  }) {
    const deadline = new Date(dto.deadline);

    const project = await this.prisma.project.create({
      data: {
        title: dto.title,
        summary: dto.summary,
        category: dto.category,
        priority: dto.priority,
        budget: Number(dto.budget),
        deadline,
        skills: dto.skills ?? [],
        attachments: [],
        clientId: dto.clientId,
      },
    });

    return project;
  }
}
