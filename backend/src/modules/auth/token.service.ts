import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'sprintos_access_secret_default_key_123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sprintos_refresh_secret_default_key_123';

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface AccessTokenPayload {
  userId: string;
  role: string;
  email: string;
  sessionId?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export class TokenService {
  static generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
  }

  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  }
}
