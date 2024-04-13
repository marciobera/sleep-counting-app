import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserDocument } from "../model/user.schema";
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { UserOutDto } from './users.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async findAll(): Promise<UserOutDto[]> {
        return await this.userModel.aggregate<UserOutDto>([
            {
                $project: {
                    name: 1,
                    gender: 1,
                    totalHours: { $size: '$hours' } // Calculate the total hours as the size of the 'hours' array
                }
            }
        ]).exec();
    }

    async findOne(id: string): Promise<User> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException('Invalid user ID');
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Set time to midnight

        const user = await this.userModel.findOne<User>({ _id: id },
            // Filter to append only hours from the last 7 days
            { name: 1, gender: 1, hours: { $filter: { input: '$hours', as: 'hour', cond: { $gte: ['$$hour.date', sevenDaysAgo] } } } }
        ).exec();


        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user
    }

    async createUser(user: User): Promise<User> {
        const existingUser = await this.userModel.findOne({ name: user.name, gender: user.gender });

        if (existingUser) {
            existingUser.name = user.name;
            existingUser.gender = user.gender;
            existingUser.hours.push(...user.hours.map(hour => ({ ...hour }))); // Create new instances
            await existingUser.save();
            return existingUser;

        } else {
            // Create a new user
            const newUser = new this.userModel(user);
            return newUser.save();
        }
    }
}
