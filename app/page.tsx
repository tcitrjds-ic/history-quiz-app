// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { getGameData, submitAnswer, resetGame } from './actions'

// 型定義
type GameData = {
  user: { id: string; loyaltyScore: number; currentStage: number }
  scenario: {
    title: string; storyText: string; question: string;
    optionA: string; optionB: string; correctOption: string;
    explanation: string; loyaltyChange: number; stage: number;
    backgroundImage: string;
    characterImage: string;
  } | null
}

type GameState = 'title' | 'playing' | 'clear'

export default function Home() {
  const [data, setData] = useState<GameData | null>(null)
  const [gameState, setGameState] = useState<GameState>('title')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const gameData = await getGameData()
    // @ts-ignore
    setData(gameData)
    if (gameData && !gameData.scenario) { setGameState('clear') }
  }

  const handleStart = () => { setGameState('playing') }
  const handleReset = async () => {
    if (!data?.user) return
    await resetGame(data.user.id)
    await loadData()
    setGameState('title')
  }

  async function handleAnswer(selectedOption: string) {
    if (!data || !data.scenario) return
    const correct = selectedOption === data.scenario.correctOption
    setIsCorrect(correct)
    setShowResult(true)
    const nextStage = correct ? data.scenario.stage + 1 : data.scenario.stage
    const loyaltyChange = correct ? data.scenario.loyaltyChange : -5
    await submitAnswer(data.user.id, correct, nextStage, loyaltyChange)
  }

  const handleNext = async () => {
    setShowResult(false)
    await loadData()
  }

  if (!data || !data.user) return <div className="h-screen bg-black text-white flex items-center justify-center font-serif">読み込み中...</div>

  // --- タイトル画面 ---
  if (gameState === 'title') {
    return (
      <div className="relative h-screen w-full bg-stone-900 flex flex-col items-center justify-center text-white overflow-hidden font-serif select-none">
        <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1623842828352-7e7616236b33?auto=format&fit=crop&q=80')] bg-cover bg-center contrast-125 saturate-50" style={{imageRendering: 'pixelated'}}></div>
        <div className="z-10 text-center p-10 border-8 border-double border-yellow-600 bg-black/80 rounded-lg shadow-2xl">
          <h1 className="text-6xl font-bold mb-6 text-yellow-500 tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">鎌倉殿の試練</h1>
          <p className="text-2xl mb-10 text-stone-300">ドット絵で甦る、御家人の物語</p>
          <button onClick={handleStart} className="px-16 py-5 bg-red-800 hover:bg-red-700 border-4 border-red-950 text-white font-bold text-2xl rounded-none shadow-lg transition active:translate-y-1">
            いざ、出陣
          </button>
        </div>
      </div>
    )
  }

  // --- クリア画面 ---
  if (gameState === 'clear') {
    return (
      <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center font-serif select-none bg-stone-900">
         <h2 className="text-5xl text-yellow-500 mb-6 font-bold drop-shadow-lg">天晴れ！！</h2>
         <p className="text-2xl mb-10">激動の鎌倉時代を生き抜きました。</p>
         <div className="bg-stone-800/90 p-8 border-4 border-yellow-600 mb-10 text-center">
            <p className="mb-4 text-xl">最終信頼度</p>
            <p className="text-7xl font-bold text-yellow-400">{data.user.loyaltyScore} <span className="text-3xl">/ 100</span></p>
         </div>
         <button onClick={handleReset} className="px-10 py-4 bg-stone-700 hover:bg-stone-600 border-4 border-stone-900 rounded-none text-xl">
           タイトルに戻る
         </button>
      </div>
    )
  }

  // --- ゲームプレイ画面 ---
  const scenario = data.scenario!

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-serif select-none">
      
      {/* 背景レイヤー */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 contrast-125 saturate-50 blur-[1px]"
        style={{ backgroundImage: `url(${scenario.backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* キャラクターレイヤー */}
      <div className="absolute inset-0 flex items-end justify-center z-10 pointer-events-none pb-[220px]">
        <img 
          src={scenario.characterImage} 
          alt="武将画像" 
          className="w-64 h-64 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]"
          style={{ imageRendering: 'pixelated' }} 
        />
      </div>

      {/* HUD（信頼度バー） */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
        <div className="bg-black/80 p-4 border-4 border-stone-600 text-white rounded-none">
          <p className="text-sm text-stone-400 mb-1">第 {scenario.stage} 章</p>
          <h2 className="text-2xl font-bold text-yellow-100 tracking-wider">{scenario.title}</h2>
        </div>
        <div className="bg-black/80 p-4 border-4 border-stone-600 text-white w-56 rounded-none">
          <div className="flex justify-between text-sm mb-2"><span>主君への忠義</span><span>{data.user.loyaltyScore}</span></div>
          <div className="w-full h-4 bg-stone-900 border-2 border-stone-700 rounded-none p-[2px]">
            <div className={`h-full transition-all duration-500 ${data.user.loyaltyScore < 30 ? 'bg-red-600' : 'bg-green-600'}`} style={{ width: `${data.user.loyaltyScore}%` }}></div>
          </div>
        </div>
      </div>

      {/* メッセージウィンドウ */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
        <div className="max-w-4xl mx-auto bg-black/90 border-4 border-white/80 rounded-sm p-6 min-h-[200px] relative shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          
          {/* 結果発表時（解説のみ表示） */}
          {showResult ? (
            <div>
               <p className="text-xl text-white leading-relaxed font-medium mb-4">{scenario.explanation}</p>
               <button onClick={handleNext} className="absolute bottom-4 right-4 px-8 py-3 bg-yellow-600 hover:bg-yellow-500 border-4 border-yellow-800 text-white font-bold rounded-none animate-bounce">次へ ▼</button>
            </div>
          ) : (
            /* 出題時（ストーリー ＋ 問題文を表示） */
            <div>
              <p className="text-xl text-stone-300 leading-relaxed font-medium mb-4">
                {scenario.storyText}
              </p>
              <div className="border-t border-stone-600 pt-2 mt-2">
                <p className="text-xl text-yellow-100 font-bold">
                  <span className="text-yellow-500 mr-2">【問】</span>
                  {scenario.question}
                </p>
              </div>
            </div>
          )}
          
        </div>

        {/* 選択肢ボタン */}
        {!showResult && (
          <div className="max-w-4xl mx-auto mt-4 flex flex-col md:flex-row gap-4">
            <button onClick={() => handleAnswer('A')} className="flex-1 bg-blue-900/90 border-4 border-blue-400 hover:bg-blue-800 hover:translate-y-1 text-white p-5 rounded-none text-left transition group relative overflow-hidden">
              <span className="text-blue-300 mr-4 font-bold">A.</span>
              <span className="font-bold text-2xl text-white">{scenario.optionA}</span>
            </button>
            <button onClick={() => handleAnswer('B')} className="flex-1 bg-red-900/90 border-4 border-red-400 hover:bg-red-800 hover:translate-y-1 text-white p-5 rounded-none text-left transition group relative overflow-hidden">
              <span className="text-red-300 mr-4 font-bold">B.</span>
              <span className="font-bold text-2xl text-white">{scenario.optionB}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}