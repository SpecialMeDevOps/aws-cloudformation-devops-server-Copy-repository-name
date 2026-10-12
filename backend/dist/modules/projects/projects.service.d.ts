import { PrismaService } from '../../common/prisma.service.js';
export declare class ProjectsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listProjects(clientId?: string): Promise<{
        id: string;
        title: string;
        summary: string;
        category: string;
        priority: string;
        budget: number;
        deadline: Date;
        skills: string[];
        status: import(".prisma/client").$Enums.ProjectStatus;
        attachments: string | number | boolean | import("@prisma/client/runtime/library.js").JsonObject | import("@prisma/client/runtime/library.js").JsonArray;
        client: {
            id: string;
            name: string;
            email: string;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
        } | null;
    }[]>;
    findProjectById(id: string): Promise<{
        client: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        assignee: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        summary: string;
        title: string;
        category: string;
        priority: string;
        budget: number;
        deadline: Date;
        skills: string[];
        status: import(".prisma/client").$Enums.ProjectStatus;
        attachments: import("@prisma/client/runtime/library.js").JsonValue | null;
        clientId: string;
        assigneeId: string | null;
    }>;
    createProject(dto: {
        title: string;
        summary: string;
        category: string;
        priority: string;
        budget: number;
        deadline: string;
        skills: string[];
        clientId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        summary: string;
        title: string;
        category: string;
        priority: string;
        budget: number;
        deadline: Date;
        skills: string[];
        status: import(".prisma/client").$Enums.ProjectStatus;
        attachments: import("@prisma/client/runtime/library.js").JsonValue | null;
        clientId: string;
        assigneeId: string | null;
    }>;
}
