import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Gender, User } from '../model/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { MockedUserModel, mockedUserModelData } from '../helpers/mocked-user.model';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: MockedUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('can get all users with total hours', () => {
    return service.findAll().then((users) => {
      expect(users).toEqual(mockedUserModelData.mockAllUser);
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('gender');
      expect(users[0]).toHaveProperty('totalHours');
    });
  });

  it('can get a user using valid id', () => {
    return service.findOne(mockedUserModelData.mockUserId).then((user) => {
      expect(user).toEqual(mockedUserModelData.mockUser);
      expect(user.name).toEqual('user');
      expect(user.gender).toEqual(Gender.FEMALE);
      expect(user.hours).toHaveLength(1);
      expect(typeof user.hours[0].value).toEqual("number");
      expect(user.hours[0].date).toBeInstanceOf(Date);
    });
  });



  it('fail to get a user that does not exist', () => {
    return service.findOne('661984814f15c295f7a7d30d').then(() => {
      throw new Error('Should not reach this point');
    }).catch((error) => {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toEqual('User not found');
    });
  });

  it('cannot get a user using invalid id', () => {
    return service.findOne('123').then(() => {
      throw new Error('Should not reach this point');
    }).catch((error) => {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toEqual('Invalid user ID');
    });
  });

  it('can create a new user', () => {
    return service.createUser({ name: 'new user', gender: Gender.OTHER, hours: [{ value: 9 }] }).then((user) => {
      expect(user).toHaveProperty('name');
      expect(user.name).toEqual('new user');
      expect(user.gender).toEqual(Gender.OTHER);
      expect(user.hours).toHaveLength(1);
      expect(user.hours[0].value).toEqual(9);
      expect(user.hours[0].date).toBeInstanceOf(Date);
    });
  });

  it('upsert an existing user', () => {
    expect(mockedUserModelData.mockUser.hours).toHaveLength(1);
    return service.createUser({ ...mockedUserModelData.mockUser, hours: [{ value: 10 }] }).then((user) => {
      expect(user.name).toEqual(mockedUserModelData.mockUser.name);
      expect(user.gender).toEqual(mockedUserModelData.mockUser.gender);
      expect(user.hours).toHaveLength(2);
      expect(user.hours[0].value).toEqual(mockedUserModelData.mockUser.hours[0].value);
      expect(user.hours[1].value).toEqual(10);
    });
  });
});
