// AI Panel - Background Service Worker

// 各個 AI 的網址模式
const AI_URL_PATTERNS = {
  claude: ['claude.ai'],
  chatgpt: ['chat.openai.com', 'chatgpt.com'],
  gemini: ['gemini.google.com']
};

// 使用 chrome.storage.session 儲存最新的回應（在 Service Worker 重啟時仍能保持）
async function getStoredResponses() {
  const result = await chrome.storage.session.get('latestResponses');
  return result.latestResponses || { claude: null, chatgpt: null, gemini: null };
}

async function setStoredResponse(aiType, content) {
  const responses = await getStoredResponses();
  responses[aiType] = content;
  await chrome.storage.session.set({ latestResponses: responses });
}

// 當點擊擴充功能圖示時開啟側邊欄
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 設定側邊欄行為
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// 監聽來自側邊欄和內容腳本的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // 保持通道開啟以進行非同步回應
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'SEND_MESSAGE':
      return await sendMessageToAI(message.aiType, message.message);

    case 'SEND_FILES':
      return await sendFilesToAI(message.aiType, message.files);

    case 'GET_RESPONSE':
      // 直接向內容腳本查詢即時回應（不從儲存中獲取）
      return await getResponseFromContentScript(message.aiType);

    case 'RESPONSE_CAPTURED':
      // 內容腳本擷取到了回應
      await setStoredResponse(message.aiType, message.content);
      // 轉發給側邊欄（包含討論模式所需的內容）
      notifySidePanel('RESPONSE_CAPTURED', { aiType: message.aiType, content: message.content });
      return { success: true };

    case 'CONTENT_SCRIPT_READY':
      // 內容腳本已載入並就緒
      const aiType = getAITypeFromUrl(sender.tab?.url);
      if (aiType) {
        notifySidePanel('TAB_STATUS_UPDATE', { aiType, connected: true });
      }
      return { success: true };

    default:
      return { error: '未知的訊息類型' };
  }
}

async function getResponseFromContentScript(aiType) {
  try {
    const tab = await findAITab(aiType);
    if (!tab) {
      // 如果未找到分頁，則回退到已儲存的回應
      const responses = await getStoredResponses();
      return { content: responses[aiType] };
    }

    // 向內容腳本查詢即時 DOM 內容
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_LATEST_RESPONSE'
    });

    return { content: response?.content || null };
  } catch (err) {
    // 發生錯誤時回退
    console.log('[AI Panel] 向內容腳本獲取回應失敗:', err.message);
    const responses = await getStoredResponses();
    return { content: responses[aiType] };
  }
}

async function sendMessageToAI(aiType, message) {
  try {
    const tab = await findAITab(aiType);

    if (!tab) {
      return { success: false, error: `未找到 ${aiType} 的分頁` };
    }

    // 傳送訊息給內容腳本
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'INJECT_MESSAGE',
      message
    });

    // 通知側邊欄
    notifySidePanel('SEND_RESULT', {
      aiType,
      success: response?.success,
      error: response?.error
    });

    return response;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function sendFilesToAI(aiType, files) {
  console.log('[AI Panel] 背景腳本: 為', aiType, '調用 sendFilesToAI，檔案數:', files?.length);
  try {
    const tab = await findAITab(aiType);

    if (!tab) {
      console.log('[AI Panel] 背景腳本: 未找到', aiType, '的分頁');
      return { success: false, error: `未找到 ${aiType} 的分頁` };
    }

    console.log('[AI Panel] 背景腳本: 正在向分頁', tab.id, '傳送 INJECT_FILES');
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'INJECT_FILES',
      files
    });

    console.log('[AI Panel] 背景腳本: 來自內容腳本的回應:', response);
    return response;
  } catch (err) {
    console.log('[AI Panel] 背景腳本: sendFilesToAI 錯誤:', err.message);
    return { success: false, error: err.message };
  }
}

async function findAITab(aiType) {
  const patterns = AI_URL_PATTERNS[aiType];
  if (!patterns) return null;

  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.url && patterns.some(p => tab.url.includes(p))) {
      return tab;
    }
  }

  return null;
}

function getAITypeFromUrl(url) {
  if (!url) return null;
  for (const [aiType, patterns] of Object.entries(AI_URL_PATTERNS)) {
    if (patterns.some(p => url.includes(p))) {
      return aiType;
    }
  }
  return null;
}

async function notifySidePanel(type, data) {
  try {
    await chrome.runtime.sendMessage({ type, ...data });
  } catch (err) {
    // 側邊欄可能未開啟，忽略錯誤
  }
}

// 追蹤分頁更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const aiType = getAITypeFromUrl(tab.url);
    if (aiType) {
      notifySidePanel('TAB_STATUS_UPDATE', { aiType, connected: true });
    }
  }
});
