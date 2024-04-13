import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: Object.values(Gender), required: true })
  gender: Gender;

  @Prop({
    type: [{
      value: { type: Number },
      date: { type: Date, default: Date.now }
    }],
    default: []
  })
  hours: { value: number; date: Date }[];
}

export const UserSchema = SchemaFactory.createForClass(User).index({ name: 1, gender: 1 }, { unique: true });
