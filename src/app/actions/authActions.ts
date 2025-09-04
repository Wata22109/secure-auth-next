'use server'

import { prisma } from '@/lib/prisma'
import { createJWT, setJWTCookie } from '@/lib/jwt'
import { signupSchema, loginSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signupAction(formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  // バリデーション
  const validatedData = signupSchema.safeParse(rawData)
  if (!validatedData.success) {
    return {
      error: 'バリデーションエラー',
      details: validatedData.error.errors
    }
  }

  const { name, email, password } = validatedData.data

  try {
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return {
        error: 'このメールアドレスは既に使用されています'
      }
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

    revalidatePath('/')
    redirect('/dashboard/profile')
  } catch (error) {
    return {
      error: 'アカウント作成中にエラーが発生しました'
    }
  }
}

export async function loginAction(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // バリデーション
  const validatedData = loginSchema.safeParse(rawData)
  if (!validatedData.success) {
    return {
      error: 'バリデーションエラー',
      details: validatedData.error.errors
    }
  }

  const { email, password } = validatedData.data

  try {
    // ユーザーの検索
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return {
        error: 'メールアドレスまたはパスワードが正しくありません'
      }
    }

    // アカウントロックチェック
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return {
        error: 'アカウントは一時的にロックされています。しばらく時間をおいてから再試行してください。'
      }
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, user.password)

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

      return {
        error: 'メールアドレスまたはパスワードが正しくありません'
      }
    }

    // ログイン成功時の処理
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    })

    // JWTの生成とCookie設定
    const token = await createJWT({
      sub: user.id,
      role: user.role
    })
    setJWTCookie(token)

    revalidatePath('/')
    redirect('/dashboard/profile')
  } catch (error) {
    return {
      error: 'ログイン中にエラーが発生しました'
    }
  }
}
