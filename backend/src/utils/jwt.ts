import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_for_jwt_tokens_society_management_portal';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'development_refresh_secret_key_society_management_portal';

const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
  societyId: string;
  permissions: string[];
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

export const generateRefreshToken = (payload: Omit<TokenPayload, 'permissions'>): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): Omit<TokenPayload, 'permissions'> => {
  return jwt.verify(token, REFRESH_SECRET) as Omit<TokenPayload, 'permissions'>;
};

