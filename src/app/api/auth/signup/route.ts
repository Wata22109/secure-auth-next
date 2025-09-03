import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createJWT, setJWTCookie } from '@/lib/jwt'
import { signupSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validatedData = signupSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { name, email, password } = validatedData.data

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      )
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12)

    // ユーザーの作成
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    // JWTの生成とCookie設定
    const token = await createJWT({
      sub: user.id,
      role: user.role
    })
    setJWTCookie(token)

    return NextResponse.json({
      message: 'アカウントが正常に作成されました',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'アカウント作成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
