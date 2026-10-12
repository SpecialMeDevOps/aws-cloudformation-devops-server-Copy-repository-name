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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const prisma_service_js_1 = require("../../common/prisma.service.js");
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async requestOtp(email) {
        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            throw new common_1.UnauthorizedException('Please provide a valid email address.');
        }
        let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: normalizedEmail.split('@')[0],
                    role: 'CLIENT',
                },
            });
        }
        const code = String((0, node_crypto_1.randomInt)(100000, 999999));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.prisma.otpCode.create({
            data: {
                userId: user.id,
                code,
                expiresAt,
            },
        });
        return {
            ok: true,
            email: normalizedEmail,
            code,
            expiresInSeconds: 600,
            message: 'OTP generated successfully.',
        };
    }
    async verifyOtp(email, code) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            throw new common_1.UnauthorizedException('No user found for this email.');
        }
        const otp = await this.prisma.otpCode.findFirst({
            where: {
                userId: user.id,
                code,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!otp) {
            throw new common_1.UnauthorizedException('The provided OTP is invalid or expired.');
        }
        await this.prisma.otpCode.update({
            where: { id: otp.id },
            data: { usedAt: new Date() },
        });
        const token = `demo-session-${user.id}-${Date.now()}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });
        return {
            ok: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            expiresAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map