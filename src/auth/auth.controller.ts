import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '获取 JWT Token', description: '通过 API Key 认证，获取 JWT Bearer Token。' })
  @ApiBody({ schema: { example: { apiKey: 'your_api_key' } } })
  @ApiResponse({ status: 201, description: 'Token 获取成功', schema: { example: { code: 0, message: 'success', data: { token: 'jwt_token_string' } } } })
  @ApiResponse({ status: 401, description: 'API Key 错误', schema: { example: { code: -1, message: 'Unauthorized', data: null } } })
  async login(@Body('apiKey') apiKey: string) {
    // 调试：打印收到的 apiKey
    console.log('AuthController login received apiKey:', apiKey);
    const valid = await this.authService.validateUser(apiKey);
    if (!valid) {
      throw new UnauthorizedException('API Key 错误');
    }
    const token = await this.authService.sign({ sub: apiKey });
    return { code: 0, message: 'success', data: { token } };
  }
}
