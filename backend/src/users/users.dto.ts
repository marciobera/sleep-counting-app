import { Gender } from "src/users/user.schema";

export interface UserOutDto {
    id: string;
    name: string;
    gender: Gender;
    totalHours: number;
}
