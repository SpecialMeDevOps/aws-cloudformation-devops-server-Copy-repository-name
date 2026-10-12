import { PrismaService } from '../../common/prisma.service.js';
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    requestOtp(email: string): Promise<{
        ok: boolean;
        email: string;
        code: string;
        expiresInSeconds: number;
        message: string;
    }>;
    verifyOtp(email: string, code: string): Promise<{
        ok: boolean;
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        };
        expiresAt: Date;
    }>;
}
