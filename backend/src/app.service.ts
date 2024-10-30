import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async createUser(username: string) {
    return this.prisma.user.create({
      data: {
        username,
        password: '123123',
        isAdmin: false,
        profile: {
          create: {
            sex: 0
          }
        }
      }
    })
  }
}
