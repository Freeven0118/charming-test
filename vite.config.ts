
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 這裡會自動幫您檢查是否有設定環境變數
  // process.cwd() 確保從專案根目錄讀取 .env
  const env = loadEnv(mode, process.cwd(), '');

  // 優先順序：Vercel System Env > .env file
  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';

  console.log(`[Vite Build] GEMINI_API_KEY found: ${!!apiKey}`);

  return {
    plugins: [react()],
    define: {
      // 這裡設定好「通道」，讓前端程式碼可以讀取到 API Key
      // 使用 JSON.stringify 確保值被正確替換為字串
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
    }
  }
})
