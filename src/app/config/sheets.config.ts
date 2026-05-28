// ─────────────────────────────────────────────────────────────────────────────
// Google Sheets 設定步驟：
//
// 1. 開啟 Google Sheets，建立一個新的試算表
//
// 2. 點「擴充功能」→「Apps Script」，把 google-apps-script.gs 的內容貼入並儲存
//
// 3. 點「部署」→「新增部署作業」
//    - 類型：Web 應用程式
//    - 執行身分：我（你的 Google 帳號）
//    - 誰可以存取：所有人（含匿名）
//    - 點「部署」→ 複製 Web App URL
//
// 4. 將 URL 貼到下方 scriptUrl
// ─────────────────────────────────────────────────────────────────────────────

export const sheetsConfig = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxW3OHIskS05Q9jCRM70Amkk7vjRcNH6PKo8Pu0Lkd1k76fORPFN0uDZmdrbRLFV7c0Mg/exec', // 範例: https://script.google.com/macros/s/AKfycb.../exec
};
