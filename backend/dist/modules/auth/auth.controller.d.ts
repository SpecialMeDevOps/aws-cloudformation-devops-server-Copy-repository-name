import { AuthService } from './auth.service.js';
declare class RequestOtpDto {
    email: string;
}
declare class VerifyOtpDto {
    email: string;
    code: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    requestOtp(dto: RequestOtpDto): Promise<{
        ok: boolean;
        email: string;
        code: string;
        expiresInSeconds: number;
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
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
    health(email?: string): Promise<{
        ok: boolean;
        email: string | null;
        service: string;
    }>;
}
export {};
