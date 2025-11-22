<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Text edit demo (文字替換示意)

The following demonstrates a feature of this project: select a text region in an image and replace it with specified text (left: original, right: edited).

以下示範本專案的功能：在圖檔中選取文字區塊並將其替換為指定文字（左圖為原始，右圖為替換後）。

<div style="display:flex;gap:12px;align-items:flex-start">
  <figure style="margin:0">
    <img src="assets/Before.png" alt="Before - original image with Chinese text" width="460" />
    <figcaption style="text-align:center;font-size:0.9rem">Before — 原始圖片</figcaption>
  </figure>
  <figure style="margin:0">
    <img src="assets/After.png" alt="After - edited image with English text" width="460" />
    <figcaption style="text-align:center;font-size:0.9rem">After — 編修後（已替換文字）</figcaption>
  </figure>
</div>
