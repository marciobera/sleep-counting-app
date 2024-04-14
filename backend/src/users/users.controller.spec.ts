import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Gender, User } from '../model/user.schema';
import { UserOutDto } from './users.dto';
import { getModelToken } from '@nestjs/mongoose';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService, {
        provide: getModelToken(User.name),
        useValue: jest.fn(),
      },],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('> findAll', () => {
    it('should return an array of cats', async () => {
      const result: UserOutDto[] = [
        <UserOutDto>{ name: 'Foo', gender: Gender.FEMALE, totalHours: 8 },
        <UserOutDto>{ name: 'Bar', gender: Gender.MALE, totalHours: 10 },
      ];
      jest.spyOn(UsersService.prototype, 'findAll').mockReturnValueOnce(Promise.resolve(result));
      expect(await controller.findAll()).toBe(result);
    });
  });

  describe('> getOne', () => {
    it('should return a user', async () => {
      const result: User = <User>{ name: 'Foo', gender: Gender.FEMALE, hours: [{ value: 9 }] };
      jest.spyOn(UsersService.prototype, 'findOne').mockReturnValueOnce(Promise.resolve(result));
      expect(await controller.getOne('123')).toBe(result);
    })
  });

  describe('> createUser', () => {
    it('should return a user', async () => {
      const result: User = <User>{ name: 'Foo', gender: Gender.FEMALE, hours: [{ value: 9, date: new Date() }] };
      jest.spyOn(UsersService.prototype, 'createUser').mockReturnValueOnce(Promise.resolve(result));
      expect(await controller.createUser(result)).toBe(result);
    });
  });
});
