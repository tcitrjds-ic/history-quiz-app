// app/actions.ts
'use server'

import { PrismaClient } from '@prisma/client'

// データベースを使う準備
const prisma = new PrismaClient()

// ゲームのデータを取得する関数
export async function getGameData() {
  // 1. プレイヤー情報を探す（さっき作った最初の1人）
  const user = await prisma.user.findFirst()

  if (!user) return null

  // 2. プレイヤーの「現在のステージ」に合ったシナリオを探す
  const scenario = await prisma.scenario.findFirst({
    where: {
      stage: user.currentStage
    }
  })

  // 3. 画面に渡す
  return {
    user,
    scenario
  }
}

// 答え合わせをして、次のステージに進める関数
export async function submitAnswer(userId: string, isCorrect: boolean, nextStage: number, loyaltyChange: number) {
  // 1. 信頼度を計算する（現在の信頼度 + 増減値）
  // ※信頼度は0〜100の間に収める
  const user = await prisma.user.findFirst({ where: { id: userId } })
  if (!user) return

  let newLoyalty = user.loyaltyScore + loyaltyChange
  if (newLoyalty > 100) newLoyalty = 100
  if (newLoyalty < 0) newLoyalty = 0

  // 2. データベースを更新する
  await prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyScore: newLoyalty,
      currentStage: isCorrect ? nextStage : user.currentStage // 正解なら次へ
    }
  })
}
// app/actions.ts の一番下に追記

// ゲームをリセットして最初からにする関数
export async function resetGame(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyScore: 50, // 信頼度を50に戻す
      currentStage: 1,  // 第1章に戻す
    }
  })
}