import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {
    // 调试：打印有效 API Key 列表
    console.log('AuthService validApiKeys:', this.validApiKeys);
  }

  // 多 API Key 支持
  private readonly validApiKeys = (process.env.API_KEYS?.split(',') || ['demo_key1','demo_key2','demo_key3']).map(k=>k.trim());

  async validateUser(apiKey: string): Promise<boolean> {
    return this.validApiKeys.includes(apiKey);
  }

  async sign(payload: { sub: string }): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
