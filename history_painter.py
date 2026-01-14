import os
import time
import webbrowser
import http.server
import socketserver
import json
import requests
import shutil

# ==========================================
# 1. 設定エリア
# ==========================================

# ★クイズデータ
QUESTION_LIST = [
    {
        "id": 1,
        "text": "1192年、源頼朝は征夷大将軍に任命され、ある場所に幕府を開きました。どこでしょう？",
        "choices": ["鎌倉", "京都"],
        "answer": "鎌倉",
        "image_prompt": "Ukiyo-e style woodblock print, Minamoto no Yoritomo wearing samurai armor sitting in Kamakura, vintage japanese art, ink painting, historical atmosphere"
    },
    {
        "id": 2,
        "text": "源義経は兄の頼朝に追われ、奥州藤原氏を頼ってどこへ逃れたでしょうか？",
        "choices": ["平泉", "太宰府"],
        "answer": "平泉",
        "image_prompt": "Japanese traditional ink painting (Sumi-e), Minamoto no Yoshitsune and Benkei walking in snow, Hiraizumi, tragic hero, historical landscape, black and white art"
    },
    {
        "id": 3,
        "text": "頼朝の死後、「尼将軍」として幕府の実権を握り、承久の乱で演説を行った人物は？",
        "choices": ["北条政子", "日野富子"],
        "answer": "北条政子",
        "image_prompt": "Historical illustration of Hojo Masako as a Buddhist nun, giving a speech to many samurai warriors, detailed Japanese history art, serious face, Kamakura period"
    },
    {
        "id": 4,
        "text": "元寇において、モンゴル軍がとった戦法はどちらでしょうか？",
        "choices": ["集団戦法", "一騎打ち"],
        "answer": "集団戦法",
        "image_prompt": "Ancient Japanese scroll painting (Emakimono) depicting the Mongol invasion of Japan, samurai vs mongol army battle, dynamic war scene, chaotic, historical art style"
    }
]

OUTPUT_DIR = "site_images"
PORT = 3000

# ==========================================
# 2. クイズアプリ(HTML)生成
# ==========================================

def create_quiz_app():
    js_questions = json.dumps(QUESTION_LIST, ensure_ascii=False)

    html_content = f"""
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>歴史の旅</title>
        <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">
        <style>
            body {{
                margin: 0;
                padding: 0;
                width: 100vw;
                height: 100vh;
                background-color: #000;
                color: #fff;
                font-family: 'DotGothic16', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }}
            #game-container {{
                width: 100%;
                max-width: 800px;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background-color: #111;
                box-sizing: border-box;
                padding: 10px;
            }}
            
            /* 画像エリア（高さ45%固定） */
            #image-area {{
                flex: 0 0 45%; 
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 10px;
                overflow: hidden;
                border: 2px solid #fff;
                background: #000;
            }}
            img {{
                width: 100%;
                height: 100%;
                object-fit: contain;
            }}

            /* テキストエリア */
            #text-area {{
                flex: 0 0 50%;
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }}
            h2 {{
                font-size: 1.5rem;
                margin: 0 0 20px 0;
                text-align: center;
                padding: 0 10px;
            }}
            
            .choices-container {{
                display: flex;
                gap: 20px;
                width: 90%;
                justify-content: center;
            }}
            .btn {{
                flex: 1;
                padding: 20px 10px;
                font-size: 1.3rem;
                font-family: 'DotGothic16', sans-serif;
                background: #000;
                color: #fff;
                border: 2px solid #fff;
                cursor: pointer;
                transition: 0.1s;
                border-radius: 8px;
            }}
            .btn:hover {{ background: #333; transform: translateY(-2px); }}
            .btn:active {{ background: #555; transform: translateY(2px); }}
            
            .correct {{ background: #008800 !important; border-color: #00ff00 !important; }}
            .wrong {{ background: #880000 !important; border-color: #ff0000 !important; }}
            .hidden {{ display: none !important; }}
        </style>
    </head>
    <body>
        <div id="game-container">
            <div id="quiz-screen" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center;">
                <div id="image-area">
                    <img id="q-image" src="" alt="歴史画像">
                </div>
                <div id="text-area">
                    <h2 id="q-text">読み込み中...</h2>
                    <div class="choices-container" id="choices-box"></div>
                </div>
            </div>

            <div id="end-screen" class="hidden" style="text-align:center; margin-top: 30vh;">
                <h1>完</h1>
                <p>歴史の旅が終わりました。</p>
                <br>
                <button class="btn" onclick="location.reload()" style="padding: 20px 40px;">最初に戻る</button>
            </div>
        </div>

        <script>
            const questions = {js_questions};
            let currentIndex = 0;
            const ts = new Date().getTime();

            function showQuestion(index) {{
                if (index >= questions.length) {{
                    document.getElementById('quiz-screen').classList.add('hidden');
                    document.getElementById('end-screen').classList.remove('hidden');
                    return;
                }}
                const q = questions[index];
                document.getElementById('q-image').src = '{OUTPUT_DIR}/question_' + q.id + '.png?t=' + ts;
                document.getElementById('q-text').innerText = q.text;

                const box = document.getElementById('choices-box');
                box.innerHTML = '';
                q.choices.forEach(choice => {{
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.innerText = choice;
                    btn.onclick = () => checkAnswer(btn, choice, q.answer);
                    box.appendChild(btn);
                }});
            }}

            function checkAnswer(btn, choice, correct) {{
                const allBtns = document.querySelectorAll('.btn');
                allBtns.forEach(b => b.disabled = true);

                if (choice === correct) {{
                    btn.classList.add('correct');
                    btn.innerText = "正解！";
                    setTimeout(() => {{ 
                        currentIndex++; 
                        showQuestion(currentIndex); 
                    }}, 1000);
                }} else {{
                    btn.classList.add('wrong');
                    btn.innerText = "不正解...";
                    setTimeout(() => {{ 
                        btn.classList.remove('wrong'); 
                        btn.innerText = choice;
                        allBtns.forEach(b => b.disabled = false);
                    }}, 1000);
                }}
            }}
            showQuestion(0);
        </script>
    </body>
    </html>
    """
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    print("✅ HTMLファイルを作成しました")

# ==========================================
# 3. 画像生成 (ゆっくりモード)
# ==========================================

def generate_images_slowly():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    print("\n--- 歴史画像の生成を開始します ---")
    print("⚠ 注意: 制限回避のため、1枚ごとに20秒休憩します。")
    print("  (ゆっくり待ちましょう...)\n")

    for q in QUESTION_LIST:
        filename = os.path.join(OUTPUT_DIR, f"question_{q['id']}.png")
        
        # すでに画像がある場合はスキップ
        if os.path.exists(filename):
            print(f"[{q['id']}] 画像あり: OK")
            continue

        print(f"[{q['id']}] 描画中... テーマ: {q['answer']}")
        
        # プロンプトのエンコード
        prompt = requests.utils.quote(q['image_prompt'])
        
        # ★対策: seedを「ID」で固定し、毎回同じリクエストにする（サーバー負荷軽減）
        url = f"https://image.pollinations.ai/prompt/{prompt}?width=800&height=600&model=flux&nologo=true&seed={q['id']}"
        
        try:
            res = requests.get(url, timeout=60)
            if res.status_code == 200:
                with open(filename, 'wb') as f:
                    f.write(res.content)
                print(f"   ✅ 保存完了！")
            else:
                print(f"   ❌ 失敗 (Status: {res.status_code})")
        except Exception as e:
            print(f"   ❌ エラー: {e}")
            
        # ★対策: ここで20秒しっかり休む！
        print("   (休憩中...20秒)...")
        time.sleep(20)

# ==========================================
# 4. サーバー起動
# ==========================================

def start_server():
    Handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"\n==================================================")
            print(f" サーバー起動完了！")
            print(f" 👉 http://localhost:{PORT}")
            print(f"==================================================\n")
            webbrowser.open(f"http://localhost:{PORT}")
            httpd.serve_forever()
    except OSError:
        print(f"ポート{PORT}が使用中です。PowerShellを再起動してください。")

if __name__ == "__main__":
    create_quiz_app()
    generate_images_slowly() # ゆっくり生成実行
    start_server()