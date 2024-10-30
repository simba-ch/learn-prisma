import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/user')
  async createUser(@Body('username') username: string) {
    const res = await this.appService.createUser(username);
    console.log("🚀 ~ AppController ~ createUser ~ res:", res)
    return res
  }
}
