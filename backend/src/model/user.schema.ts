import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
export type UserDocument = User & Document;

// Define gender enum
enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

@Schema()
export class User {
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  gender: Gender;
  @Prop({ required: true })
  hours: number;
  @Prop({ required: true })
  date: Date;
}
export const UserSchema = SchemaFactory.createForClass(User)
