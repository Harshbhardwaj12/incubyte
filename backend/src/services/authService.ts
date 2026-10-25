import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config, normalizeEmail } from '../config.js';
import { AppError } from '../errors.js';
import * as userRepository from '../repositories/userRepository.js';
import type { AuthTokenPayload, PublicUser } from '../types.js';

function toPublicUser(user: {
  id: string;
  email: string;
  role: PublicUser['role'];
}): PublicUser {
  return { id: user.id, email: user.email, role: user.role };
}

function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export async function register(
  email: string,
  password: string,
): Promise<{ user: PublicUser; token: string }> {
  const emailNormalized = normalizeEmail(email);
  const existing = await userRepository.findUserByNormalizedEmail(emailNormalized);
  if (existing) {
    throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  // Public registration never grants admin.
  let user: Awaited<ReturnType<typeof userRepository.createUser>>;
  try {
    user = await userRepository.createUser({
      email: email.trim(),
      emailNormalized,
      passwordHash,
      role: 'user',
    });
  } catch (error) {
    // The unique index is the final guard when two registrations race.
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
    }
    throw error;
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: toPublicUser(user), token };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: PublicUser; token: string }> {
  const emailNormalized = normalizeEmail(email);
  const user = await userRepository.findUserByNormalizedEmail(emailNormalized);
  if (!user) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: toPublicUser(user), token };
}
