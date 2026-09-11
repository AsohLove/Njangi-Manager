import { Request } from 'express';
import { User } from './types/user.type';

export type AuthenticatedRequest = Request & {
  user: User;
};
