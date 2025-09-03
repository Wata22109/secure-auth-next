import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from './lib/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 保護されたルートの定義
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      await verifyJWT(token)
      return NextResponse.next()
    } catch (error) {
      // JWTが無効な場合、ログインページにリダイレクト
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ログイン済みユーザーがログインページやサインアップページにアクセスした場合
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isAuthRoute) {
    const token = request.cookies.get('auth-token')?.value

    if (token) {
      try {
        await verifyJWT(token)
        // 認証済みユーザーはダッシュボードにリダイレクト
        return NextResponse.redirect(new URL('/dashboard/profile', request.url))
      } catch (error) {
        // JWTが無効な場合はそのまま進む
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup'
  ]
}
