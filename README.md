<div align="center">
<img width="800" height="316" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio.

## About

TextInpaint Pro 是一款基於 Google 最新 Gemini 3 Pro Image (Nano Banana Pro) 模型開發的智慧型網頁應用程式。它專注於解決「圖片文字替換」的難題，能夠在保留原始圖片背景紋理、光影與設計風格的前提下，精準地將圖片中的指定文字修改為您需要的內容。
無論是翻譯海報內容、修正圖片上的錯字，或是更改設計稿上的數據，TextInpaint Pro 都能提供如同專業修圖師般的無縫效果。

🌟 核心功能 (Key Features)

- 精準 Inpainting: 僅針對框選區域進行修改，嚴格保留圖片其餘部分的原始細節。
- 風格一致性: AI 會自動分析周圍像素，讓新生成的文字在字體、顏色、光影上與原圖完美融合。
- 連續編輯模式: 支援對同一張圖片進行多次修改（例如一次修改標題，接著修改內文），無需反覆上傳。
- 高解析度輸出: 支援輸出高品質圖片，滿足設計與展示需求。

🔧 核心技術 (Core Technologies)
本專案採用了先進的生成式 AI 技術與前端遮罩策略：

- Gemini 3 Pro Image Model (gemini-3-pro-image-preview):  
  使用代號為 "Nano Banana Pro" 的頂尖影像生成模型。該模型具備極強的語意理解與圖像合成能力，能聽懂 "Replace text inside the mask" 等複雜指令。

- 遮罩策略 (Visual Reference Strategy):  
  動態生成一張「視覺導引圖 (Visual Guide)」。這張圖會將原圖的非編輯區域壓暗 (Dimmed)，並在編輯區域畫上鮮豔的邊框。
  - 好處是，模型能同時看到「圖片內容」與「標記位置」，這能提供最強的像素對齊能力，解決位置偏移問題。
  - 比純黑白遮罩更有效，它會將非編輯區壓暗並用綠框標示編輯區，讓 AI 能完美對齊像素，不再改錯地方。

Tech Stack:

- Frontend: React 18, TypeScript
- Styling: Tailwind CSS (現代化深色模式介面)
- SDK: Google GenAI SDK for JavaScript

🚀 使用步驟 (Usage Guide)

1. 連接 API Key:  
   進入應用程式後，點擊按鈕連結您的 Google Cloud 帳號（需啟用 Billing 以使用 Gemini 3 Pro 高階模型）。
2. 上傳圖片:  
   點擊首頁的 "Start Editing" 區塊，上傳您想要修改的 JPG 或 PNG 圖片。
3. 框選範圍 (Select Region):  
   在畫布上直接拖曳滑鼠，框出您想要替換的文字區域。小撇步：框選範圍建議比文字稍大一點點，讓 AI 有足夠的空間運算背景紋理。
4. 輸入新文字:  
   在右側控制面板輸入您想要呈現的新文字（支援繁體中文、英文等）。
5. 生成與下載:  
   點擊 "Generate Inpaint"。滿意結果後可點擊 "Download" 保存，或點擊 "Next Edit" 繼續修改圖片的其他位置。

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## App screenshots

<div style="display:flex;gap:12px;align-items:flex-start">
  <figure style="margin:0">
    <img src="assets/page1.png" alt="App homepage" width="400" />
    <figcaption style="text-align:center;font-size:0.9rem">
      Page 1 — App homepage / 本應用首頁
      <div style="font-size:0.85rem;color:#666">Landing screen where users start editing by uploading an image. 上傳圖片開始編輯的首頁畫面。</div>
    </figcaption>
  </figure>
  <figure style="margin:0">
    <img src="assets/page2.png" alt="Editor - select region and enter text" width="400" />
    <figcaption style="text-align:center;font-size:0.9rem">
      Page 2 — Editor after upload: select region and enter replacement text / 上傳後編輯畫面：選取欲替換區域並輸入替換文字
      <div style="font-size:0.85rem;color:#666">Screenshot showing selection box and the replacement-text input before generating the inpainted image. 顯示選取框與輸入替換文字的編輯畫面。</div>
    </figcaption>
  </figure>
</div>

## Text edit demo (文字替換示意)

The following demonstrates a feature of this project: select a text region in an image and replace it with specified text (left: original, right: edited).

下圖示範本專案的功能：在圖檔中選取文字區塊並將其替換為指定文字（左圖為原始，右圖為替換後）。

<div style="display:flex;gap:12px;align-items:flex-start">
  <figure style="margin:0">
    <img src="assets/Before.png" alt="Before - original image with Chinese text" width="400" />
    <figcaption style="text-align:center;font-size:0.9rem">Before — 原始圖片</figcaption>
  </figure>
  <figure style="margin:0">
    <img src="assets/After.png" alt="After - edited image with English text" width="400" />
    <figcaption style="text-align:center;font-size:0.9rem">After — 編修後（已替換文字）</figcaption>
  </figure>
</div>
