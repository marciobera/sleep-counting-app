import { Gender } from "src/model/user.schema";

export interface UserOutDto {
    id: string;
    name: string;
    gender: Gender;
    totalHours: number;
}
