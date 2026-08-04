import { Schema, model } from '@forgedevstack/harbor';

const UserSchema = new Schema({
  email: { type: 'String', required: true, unique: true },
  name: { type: 'String', required: true },
  passwordHash: { type: 'String', required: false },
  provider: { type: 'String', required: true, default: 'password' },
  providerId: { type: 'String', required: false },
  role: { type: 'String', enum: ['user', 'admin'], default: 'user' },
  premium: { type: 'Boolean', default: false },
  createdAt: { type: 'Date', default: () => new Date() },
});

export const User = model('User', UserSchema);
