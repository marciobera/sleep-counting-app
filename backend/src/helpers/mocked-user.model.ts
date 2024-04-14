import { Gender, User } from "../model/user.schema";
import { UserOutDto } from "../users/users.dto";

const mockUserId = '66197e41fdd10168e968c1b6';
const mockNewUserId = '661a65f4758cf47d6dbf439d';
const mockUser = { _id: mockUserId, name: 'user', gender: Gender.FEMALE, hours: [{ value: 9, date: new Date() }] } as User;
const mockAllUser: UserOutDto[] = [<UserOutDto>{ name: 'test', gender: Gender.MALE, totalHours: 15 }];

/**
 * Mocked UsersModel class.
 */
export class MockedUserModel {
    public _id: string;
    public name: string;
    public gender: Gender;
    public hours: User["hours"];

    constructor(private user: User) {
        this.name = user.name;
        this.gender = user.gender;
        this.hours = user.hours;
    }

    save = jest.fn().mockImplementationOnce(() => {
        // Attach the current date to the new hous items
        this.user.hours = this.user.hours.map(hour => ({ date: new Date(), ...hour }))

        return <User>{
            ...this.user,
            _id: mockNewUserId
        }
    });

    static find = jest.fn().mockReturnThis();

    static aggregate = () => ({
        exec: jest.fn().mockResolvedValue(mockAllUser),
    });

    static exec = jest.fn().mockReturnValue(mockUser);

    static findOne = jest.fn().mockImplementation((params: { _id: string, name: string, gender: Gender, hours: User["hours"] }) => {
        // Check if params user is the same as mockUser
        if (params.name === mockUser.name && params.gender === mockUser.gender) {
            return { exec: jest.fn().mockResolvedValue(new MockedUserModel(mockUser)) };
        }

        // If not existing mockedUser then couldnt find user
        if (params._id !== mockUserId) return { exec: jest.fn().mockResolvedValue(undefined) };

        return this;
    });
}

export const mockedUserModelData = {
    mockUserId,
    mockUser,
    mockAllUser,
}
