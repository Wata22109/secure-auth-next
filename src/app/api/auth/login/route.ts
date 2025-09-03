import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createJWT, setJWTCookie } from '@/lib/jwt'
import { loginSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Login attempt:', { email: body.email })
    
    // バリデーション
    const validatedData = loginSchema.safeParse(body)
    if (!validatedData.success) {
      console.log('Validation error:', validatedData.error.errors)
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { email, password } = validatedData.data

    // ユーザーの検索
    const user = await prisma.user.findUnique({
      where: { email }
    })

    console.log('User found:', user ? { id: user.id, email: user.email, role: user.role } : 'Not found')

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // アカウントロックチェック
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      console.log('Account locked:', user.lockoutUntil)
      return NextResponse.json(
        { error: 'アカウントは一時的にロックされています。しばらく時間をおいてから再試行してください。' },
        { status: 423 }
      )
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('Password validation:', { isValid: isValidPassword })

    if (!isValidPassword) {
      // ログイン失敗時の処理
      const failedAttempts = user.failedLoginAttempts + 1
      const lockoutUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null // 15分

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockoutUntil
        }
      })

      console.log('Login failed, updated attempts:', failedAttempts)
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // ログイン成功時の処理
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    })

    // ログイン履歴の記録
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent
      }
    })

    // JWTの生成とCookie設定
    const token = await createJWT({
      sub: user.id,
      role: user.role
    })
    setJWTCookie(token)

    console.log('Login successful:', { userId: user.id, email: user.email })

    return NextResponse.json({
      message: 'ログインに成功しました',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'ログイン中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
