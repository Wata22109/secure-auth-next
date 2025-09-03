import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 シードデータの作成を開始します...')

  // 管理者ユーザーの作成
  const adminPassword = await bcrypt.hash('Admin123!@#', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '管理者',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // 一般ユーザーの作成
  const userPassword = await bcrypt.hash('User123!@#', 12)
  const normalUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: '一般ユーザー',
      password: userPassword,
      role: 'USER',
    },
  })

  // テスト用ユーザーの作成
  const testPassword = await bcrypt.hash('Test123!@#', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'テストユーザー',
      password: testPassword,
      role: 'USER',
    },
  })

  // サンプルのログイン履歴を作成
  const sampleLoginHistories = [
    {
      userId: adminUser.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
    },
    {
      userId: adminUser.id,
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2日前
    },
    {
      userId: normalUser.id,
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12時間前
    },
    {
      userId: testUser.id,
      ipAddress: '192.168.1.300',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6時間前
    },
  ]

  // 既存のログイン履歴を削除
  await prisma.loginHistory.deleteMany({})

  // 新しいログイン履歴を作成
  for (const history of sampleLoginHistories) {
    await prisma.loginHistory.create({
      data: history,
    })
  }

  console.log('✅ シードデータの作成が完了しました！')
  console.log('📋 作成されたユーザー:')
  console.log(`  管理者: admin@example.com / Admin123!@#`)
  console.log(`  一般ユーザー: user@example.com / User123!@#`)
  console.log(`  テストユーザー: test@example.com / Test123!@#`)
  console.log('')
  console.log('🔐 セキュリティ注意: 本番環境では必ずパスワードを変更してください！')
}

main()
  .catch((e) => {
    console.error('❌ シードデータの作成中にエラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
