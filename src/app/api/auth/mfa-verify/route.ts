import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createJWT, setJWTCookie } from '@/lib/jwt'
import { verifyTOTP, verifyBackupCode } from '@/lib/mfa'

export async function POST(request: NextRequest) {
  try {
    const { userId, token, isBackupCode = false } = await request.json()

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'ユーザーIDと認証コードが必要です' },
        { status: 400 }
      )
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFAが有効になっていません' },
        { status: 400 }
      )
    }

    if (!user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA設定が見つかりません' },
        { status: 400 }
      )
    }

    let isValid = false
    let remainingBackupCodes: string[] = []

    if (isBackupCode) {
      // バックアップコードの検証
      if (!user.backupCodes) {
        return NextResponse.json(
          { error: 'バックアップコードが設定されていません' },
          { status: 400 }
        )
      }

      try {
        const backupCodes = JSON.parse(user.backupCodes)
        const result = verifyBackupCode(token, backupCodes)
        isValid = result.isValid
        remainingBackupCodes = result.remainingCodes

        if (isValid) {
          // 使用されたバックアップコードを更新
          await prisma.user.update({
            where: { id: userId },
            data: {
              backupCodes: JSON.stringify(remainingBackupCodes)
            }
          })
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'バックアップコードの処理中にエラーが発生しました' },
          { status: 500 }
        )
      }
    } else {
      // TOTPトークンの検証
      isValid = verifyTOTP(token, user.mfaSecret)
    }

    if (!isValid) {
      return NextResponse.json(
        { error: '無効な認証コードです' },
        { status: 401 }
      )
    }

    // MFA認証成功時の処理
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
    const jwtToken = await createJWT({
      sub: user.id,
      role: user.role
    })
    setJWTCookie(jwtToken)

    return NextResponse.json({
      message: 'MFA認証に成功しました',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      remainingBackupCodes: remainingBackupCodes.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'MFA認証中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
