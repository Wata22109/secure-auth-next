import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/jwt'
import { verifyTOTP } from '@/lib/mfa'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: '認証コードが必要です' },
        { status: 400 }
      )
    }

    // ユーザー情報を取得
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    if (!dbUser.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFAは有効になっていません' },
        { status: 400 }
      )
    }

    if (!dbUser.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA設定が見つかりません' },
        { status: 400 }
      )
    }

    // TOTPトークンを検証
    const isValid = verifyTOTP(token, dbUser.mfaSecret)
    if (!isValid) {
      return NextResponse.json(
        { error: '無効な認証コードです' },
        { status: 400 }
      )
    }

    // MFAを無効化
    await prisma.user.update({
      where: { id: user.sub },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: null
      }
    })

    return NextResponse.json({
      message: 'MFAが正常に無効化されました'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'MFA無効化中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
