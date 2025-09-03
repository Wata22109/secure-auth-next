import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export interface JWTPayload {
  sub: string // user id
  role: string
  iat: number
  exp: number
}

export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('3h')
    .sign(secret)
  
  return jwt
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as JWTPayload
}

export function setJWTCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3 * 60 * 60 // 3 hours
  })
}

export function clearJWTCookie() {
  const cookieStore = cookies()
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  })
}

export function getJWTFromRequest(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null
}

export async function getCurrentUser(request: NextRequest) {
  const token = getJWTFromRequest(request)
  if (!token) return null
  
  try {
    const payload = await verifyJWT(token)
    return payload
  } catch (error) {
    return null
  }
}
