import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserOutDto } from './users.dto';
import { User } from 'src/model/user.schema';

@Controller('/api/v1/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async findAll(): Promise<UserOutDto[]> {
        return this.usersService.findAll();
    }

    @Get('/:userId')
    async getOne(@Param('userId') userId: string): Promise<User> {
        return this.usersService.findOne(userId);
    }

    @Post()
    async createUser(@Body() user: User): Promise<User> {
        return this.usersService.createUser(user);
    }
}
