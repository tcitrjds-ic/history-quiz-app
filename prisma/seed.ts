// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 既存のデータをリセット
  await prisma.scenario.deleteMany()
  await prisma.user.deleteMany()

  // プレイヤー作成
  await prisma.user.create({
    data: { loyaltyScore: 50, currentStage: 1 }
  })

  // 新しいストーリーデータ（いただいたキーワードを網羅）
  const scenarios = [
    {
      stage: 1,
      title: "鎌倉幕府の成立",
      storyText: "1185年、平氏を滅ぼした源頼朝は、国ごとに「守護」を置いて軍事・警察権を掌握した。さらに御家人を統率するための役所も設置された。",
      question: "源頼朝が設置した、御家人の統率や軍事・警察を担う役所を何というか？",
      optionA: "侍所（さむらいどころ）",
      optionB: "政所（まんどころ）",
      correctOption: "A",
      explanation: "正解は侍所。初代長官には和田義盛が就任した。頼朝はこれにより武士団を強力にまとめ上げた。",
      loyaltyChange: 10,
      backgroundImage: "/images/bg_01.jpg", 
      characterImage:  "/images/char_01.jpg" // 想定：源頼朝
    },
    {
      stage: 2,
      title: "執権政治と御恩",
      storyText: "頼朝の死後、北条氏が「執権」として政治の実権を握った。将軍と御家人は「土地を仲立ちとした主従関係」で結ばれている。",
      question: "将軍が御家人の領地を認めたり、新しい土地を与えたりすることを何というか？",
      optionA: "奉公（ほうこう）",
      optionB: "御恩（ごおん）",
      correctOption: "B",
      explanation: "正解は御恩。これに対し、御家人が戦いの際に命懸けで軍役を果たすことを「奉公」という。",
      loyaltyChange: 10,
      backgroundImage: "/images/bg_02.jpg",
      characterImage:  "/images/char_02.jpg" // 想定：御家人または北条氏
    },
    {
      stage: 3,
      title: "承久の乱",
      storyText: "1221年、後鳥羽上皇が幕府を倒そうと挙兵した。動揺する御家人たちに対し、北条政子が「頼朝公の恩は山よりも高い」と演説し、結束させた。",
      question: "乱の鎮圧後、朝廷の監視と西国の統括のために京都に置かれた役所は？",
      optionA: "六波羅探題（ろくはらたんだい）",
      optionB: "京都守護職",
      correctOption: "A",
      explanation: "正解は六波羅探題。これにより幕府の支配力は西日本や朝廷にも及ぶようになった。",
      loyaltyChange: 20,
      backgroundImage: "/images/bg_03.jpg",
      characterImage:  "/images/char_03.jpg" // 想定：北条政子
    },
    {
      stage: 4,
      title: "元寇の襲来",
      storyText: "モンゴル帝国（元）が襲来。「てつはう」や「集団戦法」に武士は苦戦した。時の執権・北条時宗は、国難に対し断固たる態度で挑んだ。",
      question: "二度にわたる元軍の襲来（文永の役・弘安の役）を総称して何というか？",
      optionA: "元寇（げんこう）",
      optionB: "黄巾の乱",
      correctOption: "A",
      explanation: "正解は元寇。暴風雨や石築地（防塁）の効果もあり、元軍を撃退することに成功した。",
      loyaltyChange: -10, // 恩賞不足で不満が高まるためマイナス
      backgroundImage: "/images/bg_04.jpg",
      characterImage:  "/images/char_04.jpg" // 想定：北条時宗
    },
    {
      stage: 5,
      title: "鎌倉幕府の滅亡",
      storyText: "元寇による負担で御家人は困窮した。幕府は借金を帳消しにする「永仁の徳政令」を出したが、逆に混乱を招いてしまった。",
      question: "幕府への不満が高まる中、挙兵して鎌倉幕府を倒すきっかけを作った天皇は？",
      optionA: "後醍醐天皇",
      optionB: "後白河法皇",
      correctOption: "A",
      explanation: "正解は後醍醐天皇。足利尊氏や新田義貞らが呼応し、1333年に鎌倉幕府は滅亡した。",
      loyaltyChange: -20,
      backgroundImage: "/images/bg_05.jpg",
      characterImage:  "/images/char_05.jpg" // 想定：後醍醐天皇
    }
  ]

  for (const s of scenarios) {
    await prisma.scenario.create({ data: s })
  }
  console.log('Seeding finished.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })