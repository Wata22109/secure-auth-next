import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/jwt'
import { changePasswordSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // バリデーション
    const validatedData = changePasswordSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validatedData.data

    // ユーザー情報の取得
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 現在のパスワードの検証
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, dbUser.password)
    if (!isValidCurrentPassword) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 400 }
      )
    }

    // 新しいパスワードのハッシュ化
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // パスワードの更新
    await prisma.user.update({
      where: { id: user.sub },
      data: {
        password: hashedNewPassword
      }
    })

    return NextResponse.json({
      message: 'パスワードが正常に変更されました'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'パスワード変更中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
