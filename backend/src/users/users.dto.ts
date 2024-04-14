import { Gender } from "./user.schema";

export interface UserOutDto {
    id: string;
    name: string;
    gender: Gender;
    totalHours: number;
}
