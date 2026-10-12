"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../common/prisma.service.js");
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listProjects(clientId) {
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
    async findProjectById(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: { client: true, assignee: true },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with id ${id} was not found.`);
        }
        return project;
    }
    async createProject(dto) {
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
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map