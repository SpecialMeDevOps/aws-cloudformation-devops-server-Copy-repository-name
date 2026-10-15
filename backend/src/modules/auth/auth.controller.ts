import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';

class RequestOtpDto {
  email!: string;
}

class VerifyOtpDto {
  email!: string;
  code!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request an OTP for a user login session' })
  @ApiResponse({ status: 200, description: 'OTP sent or created' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the OTP code and return a session token' })
  @ApiResponse({ status: 200, description: 'Session created' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for the auth service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    return this.authService.health();
  }
}
