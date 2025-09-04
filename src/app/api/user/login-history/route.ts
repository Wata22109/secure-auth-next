import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '10', 10) || 10, 1), 100)

    const isAdmin = (user.role || '').toUpperCase() === 'ADMIN'

    if (isAdmin && searchParams.get('all') === 'true') {
      // 管理者は全ユーザーのログイン履歴を確認可能
      const loginHistory = await prisma.loginHistory.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({
        loginHistory
      })
    }

    // 一般ユーザー: 自分の履歴
    const loginHistory = await prisma.loginHistory.findMany({
      where: {
        userId: user.sub
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      loginHistory
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'ログイン履歴の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
