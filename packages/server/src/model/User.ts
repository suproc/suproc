import { Schema, model } from 'mongoose';
import { NullArgumentException } from '../exceptions';

export interface IUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastLogin: Date;
}

export function userFactory(options: any, view?: string[]): IUser {
  if (!options) {
    throw new NullArgumentException('options');
  }
  if (view) {
    const result: any = {};
    Object.keys(options)
      .filter((key) => view.includes(key))
      .forEach((key) => {
        result[key] = options[key];
      });
    return result as IUser;
  }
  return {
    id: options.id,
    email: options.email,
    name: options.name,
    firstName: options.firstName,
    lastLogin: options.lastLogin,
  };
}

const UserSchema = new Schema(
  {
    id: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    firstName: { type: String, required: true },
    lastLogin: { type: Date },
    loggedOut: { type: Boolean },
    confirm: { type: String },
    registeredAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: {
      transform: (_doc, ret, options) => {
        return userFactory(ret, options ? options.view : undefined);
      },
    },
  }
);
UserSchema.index({ id: 1, password: 1 });
UserSchema.index({ registeredAt: 1 }, { expires: '2 days' });

export const User = model('User', UserSchema, 'users');
