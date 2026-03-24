// AI Panel - Side Panel Controller

const AI_TYPES = ['claude', 'chatgpt', 'gemini'];

// Cross-reference action keywords (inserted into message)
const CROSS_REF_ACTIONS = {
  evaluate: { prompt: '評價一下' },
  learn: { prompt: '有什麼值得借鏡的' },
  critique: { prompt: '批評一下，指出問題' },
  supplement: { prompt: '有什麼遺漏需要補充' },
  compare: { prompt: '對比一下你的觀點' }
};

// DOM Elements
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const logContainer = document.getElementById('log-container');
const fileInput = document.getElementById('file-input');
const addFileBtn = document.getElementById('add-file-btn');
const fileList = document.getElementById('file-list');

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Selected files storage
let selectedFiles = [];

// Enabled AIs state
let enabledAIs = ['chatgpt', 'gemini'];

// Track connected tabs
const connectedTabs = {
  claude: null,
  chatgpt: null,
  gemini: null
};

// Discussion Mode State
let discussionState = {
  active: false,
  topic: '',
  participants: [],  // [ai1, ai2]
  currentRound: 0,
  history: [],  // [{round, ai, type: 'initial'|'evaluation'|'response', content}]
  pendingResponses: new Set(),  // AIs we're waiting for
  roundType: null  // 'initial', 'cross-eval', 'counter'
};


// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  checkConnectedTabs();
  setupEventListeners();
  setupDiscussionMode();
  setupFileUpload();
});

async function loadSettings() {
  const result = await chrome.storage.local.get('enabledAIs');
  if (result.enabledAIs) {
    enabledAIs = result.enabledAIs;
  } else {
    // Default settings
    enabledAIs = ['chatgpt', 'gemini'];
    await chrome.storage.local.set({ enabledAIs });
  }
  
  // Update checkboxes
  document.getElementById('load-chatgpt').checked = enabledAIs.includes('chatgpt');
  document.getElementById('load-gemini').checked = enabledAIs.includes('gemini');
  document.getElementById('load-claude').checked = enabledAIs.includes('claude');
  
  applySettings();
}

function applySettings() {
  AI_TYPES.forEach(ai => {
    const isEnabled = enabledAIs.includes(ai);
    
    // Hide/show in selector
    const selector = document.getElementById(`ai-selector-${ai}`);
    if (selector) selector.classList.toggle('hidden', !isEnabled);
    
    // Hide/show in mention buttons
    const mentionBtn = document.getElementById(`mention-${ai}-btn`) || 
                      document.querySelector(`.mention-btn[data-mention="@${capitalize(ai)}"]`);
    if (mentionBtn) mentionBtn.classList.toggle('hidden', !isEnabled);
    
    // Hide/show in discussion participants
    const participantWrapper = document.getElementById(`participant-${ai}-wrapper`);
    if (participantWrapper) participantWrapper.classList.toggle('hidden', !isEnabled);
    
    // Uncheck if disabled
    if (!isEnabled) {
      const targetCheckbox = document.getElementById(`target-${ai}`);
      if (targetCheckbox) targetCheckbox.checked = false;
      
      const participantCheckbox = document.querySelector(`input[name="participant"][value="${ai}"]`);
      if (participantCheckbox) participantCheckbox.checked = false;
    }
  });
}

function setupEventListeners() {
  sendBtn.addEventListener('click', handleSend);

  const clearLogBtn = document.getElementById('clear-log-btn');
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
      const entries = logContainer.querySelectorAll('.log-entry');
      entries.forEach(entry => entry.remove());
    });
  }

  const newChatBtn = document.getElementById('new-chat-btn');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', handleNewChat);
  }

  // Settings toggle
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const newEnabled = [];
    if (document.getElementById('load-chatgpt').checked) newEnabled.push('chatgpt');
    if (document.getElementById('load-gemini').checked) newEnabled.push('gemini');
    if (document.getElementById('load-claude').checked) newEnabled.push('claude');
    
    await chrome.storage.local.set({ enabledAIs: newEnabled });
    location.reload(); // Reload to apply changes
  });

  // Enter to send, Shift+Enter for new line (like ChatGPT)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      handleSend();
    }
  });

  // Shortcut buttons (/cross, <-)
  document.querySelectorAll('.shortcut-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const insertText = btn.dataset.insert;
      const cursorPos = messageInput.selectionStart;
      const textBefore = messageInput.value.substring(0, cursorPos);
      const textAfter = messageInput.value.substring(cursorPos);

      messageInput.value = textBefore + insertText + textAfter;
      messageInput.focus();
      messageInput.selectionStart = messageInput.selectionEnd = cursorPos + insertText.length;
    });
  });

  // Action select - insert action prompt into textarea
  document.getElementById('action-select').addEventListener('change', (e) => {
    const action = e.target.value;
    if (!action) return;

    const actionConfig = CROSS_REF_ACTIONS[action];
    if (actionConfig) {
      const cursorPos = messageInput.selectionStart;
      const textBefore = messageInput.value.substring(0, cursorPos);
      const textAfter = messageInput.value.substring(cursorPos);

      const needsSpace = textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');
      const insertText = (needsSpace ? ' ' : '') + actionConfig.prompt + ' ';

      messageInput.value = textBefore + insertText + textAfter;
      messageInput.focus();
      messageInput.selectionStart = messageInput.selectionEnd = cursorPos + insertText.length;
    }
    e.target.value = '';
  });

  // Mention buttons - insert @AI into textarea
  document.querySelectorAll('.mention-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mention = btn.dataset.mention;
      const cursorPos = messageInput.selectionStart;
      const textBefore = messageInput.value.substring(0, cursorPos);
      const textAfter = messageInput.value.substring(cursorPos);

      const needsSpace = textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');
      const insertText = (needsSpace ? ' ' : '') + mention + ' ';

      messageInput.value = textBefore + insertText + textAfter;
      messageInput.focus();
      messageInput.selectionStart = messageInput.selectionEnd = cursorPos + insertText.length;
    });
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TAB_STATUS_UPDATE') {
      updateTabStatus(message.aiType, message.connected);
    } else if (message.type === 'RESPONSE_CAPTURED') {
      log(`${capitalize(message.aiType)}: 已擷取回應`, 'success');
      if (discussionState.active && discussionState.pendingResponses.has(message.aiType)) {
        handleDiscussionResponse(message.aiType, message.content);
      }
    } else if (message.type === 'SEND_RESULT') {
      if (message.success) {
        log(`${capitalize(message.aiType)}: 訊息已送出`, 'success');
      } else {
        log(`${capitalize(message.aiType)}: 失敗 - ${message.error}`, 'error');
      }
    } else if (message.type === 'REMOTE_LOG') {
      log(message.message, message.level || 'info');
    }
  });
}

async function checkConnectedTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      const aiType = getAITypeFromUrl(tab.url);
      if (aiType && enabledAIs.includes(aiType)) {
        connectedTabs[aiType] = tab.id;
        updateTabStatus(aiType, true);
      }
    }
  } catch (err) {
    log('檢查分頁時出錯: ' + err.message, 'error');
  }
}

function getAITypeFromUrl(url) {
  if (!url) return null;
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
  if (url.includes('gemini.google.com')) return 'gemini';
  return null;
}

function updateTabStatus(aiType, connected) {
  const statusEl = document.getElementById(`status-${aiType}`);
  if (statusEl) {
    statusEl.className = 'status ' + (connected ? 'connected' : 'disconnected');
    statusEl.title = connected ? '已連接' : '未找到分頁';
  }
  if (connected) {
    connectedTabs[aiType] = true;
  }
}

async function handleNewChat() {
  log('正在為所有已啟用的 AI 開啟新對話...');
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    const aiType = getAITypeFromUrl(tab.url);
    if (aiType && enabledAIs.includes(aiType)) {
      try {
        chrome.tabs.sendMessage(tab.id, { type: 'NEW_CHAT_ACTION' });
        log(`已發送新對話指令至 ${capitalize(aiType)}`, 'success');
      } catch (e) {
        log(`發送新對話至 ${capitalize(aiType)} 失敗`, 'error');
      }
    }
  }
}

async function handleSend() {
  const message = messageInput.value.trim();
  if (!message) return;

  const parsed = parseMessage(message);

  let targets;
  if (parsed.mentions.length > 0) {
    targets = parsed.mentions.filter(ai => enabledAIs.includes(ai));
  } else {
    targets = AI_TYPES.filter(ai => {
      const checkbox = document.getElementById(`target-${ai}`);
      return checkbox && checkbox.checked && enabledAIs.includes(ai);
    });
  }

  if (targets.length === 0) {
    log('未選擇目標 AI', 'error');
    return;
  }

  sendBtn.disabled = true;
  messageInput.value = '';

  const filesToSend = [...selectedFiles];
  if (filesToSend.length > 0) {
    log(`正在上傳 ${filesToSend.length} 個檔案...`);
    for (const target of targets) {
      await sendFilesToAI(target, filesToSend);
    }
    clearFiles();
    await new Promise(r => setTimeout(r, 500));
  }

  try {
    if (parsed.mutual) {
      if (targets.length < 2) {
        log('互評模式至少需要選擇 2 個 AI', 'error');
      } else {
        log(`互評模式啟動: ${targets.join(', ')}`);
        await handleMutualReview(targets, parsed.prompt);
      }
    } else if (parsed.crossRef) {
      log(`交叉引用: ${parsed.targetAIs.join(', ')} <- ${parsed.sourceAIs.join(', ')}`);
      await handleCrossReference(parsed);
    } else {
      log(`正在傳送至: ${targets.join(', ')}`);
      for (const target of targets) {
        await sendToAI(target, message);
      }
    }
  } catch (err) {
    log('錯誤: ' + err.message, 'error');
  }

  sendBtn.disabled = false;
  messageInput.focus();
}

function parseMessage(message) {
  const trimmedMessage = message.trim();
  if (trimmedMessage.toLowerCase() === '/mutual' || trimmedMessage.toLowerCase().startsWith('/mutual ')) {
    const prompt = trimmedMessage.length > 7 ? trimmedMessage.substring(7).trim() : '';
    return {
      mutual: true,
      prompt: prompt || '請評價以上觀點。你同意什麼？不同意什麼？有什麼補充？',
      crossRef: false,
      mentions: [],
      originalMessage: message
    };
  }

  if (message.trim().toLowerCase().startsWith('/cross ')) {
    const arrowIndex = message.indexOf('<-');
    if (arrowIndex === -1) {
      return { crossRef: false, mentions: [], originalMessage: message };
    }

    const beforeArrow = message.substring(7, arrowIndex).trim();
    const afterArrow = message.substring(arrowIndex + 2).trim();

    const mentionPattern = /@(claude|chatgpt|gemini)/gi;
    const targetMatches = [...beforeArrow.matchAll(mentionPattern)];
    const targetAIs = [...new Set(targetMatches.map(m => m[1].toLowerCase()))];

    const sourceMatches = [...afterArrow.matchAll(mentionPattern)];
    const sourceAIs = [...new Set(sourceMatches.map(m => m[1].toLowerCase()))];

    let actualMessage = afterArrow;
    if (sourceMatches.length > 0) {
      const lastMatch = sourceMatches[sourceMatches.length - 1];
      const lastMentionEnd = lastMatch.index + lastMatch[0].length;
      actualMessage = afterArrow.substring(lastMentionEnd).trim();
    }

    if (targetAIs.length > 0 && sourceAIs.length > 0) {
      return {
        crossRef: true,
        mentions: [...targetAIs, ...sourceAIs],
        targetAIs,
        sourceAIs,
        originalMessage: actualMessage
      };
    }
  }

  const mentionPattern = /@(claude|chatgpt|gemini)/gi;
  const matches = [...message.matchAll(mentionPattern)];
  const mentions = [...new Set(matches.map(m => m[1].toLowerCase()))];

  if (mentions.length === 2) {
    const evalKeywords = /評價|看看|怎麼樣|怎麼看|如何|講的|說的|回答|贊同|同意|分析|認為|觀點|看法|意見|借鏡|批評|補充|對比|evaluate|think of|opinion|review|agree|analysis|compare|learn from/i;

    if (evalKeywords.test(message)) {
      const sourceAI = matches[matches.length - 1][1].toLowerCase();
      const targetAI = matches[0][1].toLowerCase();

      return {
        crossRef: true,
        mentions,
        targetAIs: [targetAI],
        sourceAIs: [sourceAI],
        originalMessage: message
      };
    }
  }

  return {
    crossRef: false,
    mentions,
    originalMessage: message
  };
}

async function handleCrossReference(parsed) {
  const sourceResponses = [];
  for (const sourceAI of parsed.sourceAIs) {
    const response = await getLatestResponse(sourceAI);
    if (!response) {
      log(`無法取得 ${capitalize(sourceAI)} 的回應`, 'error');
      return;
    }
    sourceResponses.push({ ai: sourceAI, content: response });
  }

  let fullMessage = parsed.originalMessage + '\n';
  for (const source of sourceResponses) {
    fullMessage += `
<${source.ai}_response>
${source.content}
</${source.ai}_response>`;
  }

  for (const targetAI of parsed.targetAIs) {
    await sendToAI(targetAI, fullMessage);
  }
}

async function handleMutualReview(participants, prompt) {
  const responses = {};
  log(`[互評] 正在獲取 ${participants.join(', ')} 的回應...`);

  for (const ai of participants) {
    const response = await getLatestResponse(ai);
    if (!response || response.trim().length === 0) {
      log(`[互評] 無法取得 ${capitalize(ai)} 的回應 - 請確保該 AI 已先回覆`, 'error');
      return;
    }
    responses[ai] = response;
    log(`[互評] 已取得 ${capitalize(ai)} 的回應 (${response.length} 字)`);
  }

  log(`[互評] 所有回應已收集。正在傳送交叉評價...`);

  for (const targetAI of participants) {
    const otherAIs = participants.filter(ai => ai !== targetAI);
    let evalMessage = `以下是其他 AI 的觀點：\n`;
    for (const sourceAI of otherAIs) {
      evalMessage += `
<${sourceAI}_response>
${responses[sourceAI]}
</${sourceAI}_response>
`;
    }
    evalMessage += `\n${prompt}`;
    log(`[互評] 正在傳送至 ${capitalize(targetAI)}: 包含 ${otherAIs.join('+')} 的回應及指令`);
    await sendToAI(targetAI, evalMessage);
  }
  log(`[互評] 完成！所有參與者均已收到交叉評價指令`, 'success');
}

async function getLatestResponse(aiType) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'GET_RESPONSE', aiType },
      (response) => {
        resolve(response?.content || null);
      }
    );
  });
}

async function sendToAI(aiType, message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'SEND_MESSAGE', aiType, message },
      (response) => {
        if (response?.success) {
          log(`已傳送至 ${capitalize(aiType)}`, 'success');
        } else {
          log(`傳送至 ${capitalize(aiType)} 失敗: ${response?.error || '未知錯誤'}`, 'error');
        }
        resolve(response);
      }
    );
  });
}

function log(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = 'log-entry' + (type !== 'info' ? ` ${type}` : '');

  const time = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  entry.innerHTML = `<span class="time">${time}</span>${message}`;
  logContainer.insertBefore(entry, logContainer.firstChild);

  while (logContainer.children.length > 50) {
    logContainer.removeChild(logContainer.lastChild);
  }
}

function setupDiscussionMode() {
  document.getElementById('mode-normal').addEventListener('click', () => switchMode('normal'));
  document.getElementById('mode-discussion').addEventListener('click', () => switchMode('discussion'));

  document.getElementById('start-discussion-btn').addEventListener('click', startDiscussion);
  document.getElementById('next-round-btn').addEventListener('click', nextRound);
  document.getElementById('end-discussion-btn').addEventListener('click', endDiscussion);
  document.getElementById('generate-summary-btn').addEventListener('click', generateSummary);
  document.getElementById('new-discussion-btn').addEventListener('click', resetDiscussion);
  document.getElementById('interject-btn').addEventListener('click', handleInterject);

  document.querySelectorAll('input[name="participant"]').forEach(checkbox => {
    checkbox.addEventListener('change', validateParticipants);
  });
}

function switchMode(mode) {
  const normalMode = document.getElementById('normal-mode');
  const discussionMode = document.getElementById('discussion-mode');
  const normalBtn = document.getElementById('mode-normal');
  const discussionBtn = document.getElementById('mode-discussion');

  if (mode === 'normal') {
    normalMode.classList.remove('hidden');
    discussionMode.classList.add('hidden');
    normalBtn.classList.add('active');
    discussionBtn.classList.remove('active');
  } else {
    normalMode.classList.add('hidden');
    discussionMode.classList.remove('hidden');
    normalBtn.classList.remove('active');
    discussionBtn.classList.add('active');
  }
}

function validateParticipants() {
  const selected = document.querySelectorAll('input[name="participant"]:checked');
  const startBtn = document.getElementById('start-discussion-btn');
  startBtn.disabled = selected.length !== 2;
}

async function startDiscussion() {
  const topic = document.getElementById('discussion-topic').value.trim();
  if (!topic) {
    log('請輸入討論主題', 'error');
    return;
  }

  const selected = Array.from(document.querySelectorAll('input[name="participant"]:checked'))
    .map(cb => cb.value);

  if (selected.length !== 2) {
    log('請選擇 2 位參與者', 'error');
    return;
  }

  discussionState = {
    active: true,
    topic: topic,
    participants: selected,
    currentRound: 1,
    history: [],
    pendingResponses: new Set(selected),
    roundType: 'initial'
  };

  document.getElementById('discussion-setup').classList.add('hidden');
  document.getElementById('discussion-active').classList.remove('hidden');
  document.getElementById('round-badge').textContent = '第 1 輪';
  document.getElementById('participants-badge').textContent =
    `${capitalize(selected[0])} vs ${capitalize(selected[1])}`;
  document.getElementById('topic-display').textContent = topic;
  updateDiscussionStatus('waiting', `等待 ${selected.join(' 和 ')} 的初始回覆...`);

  document.getElementById('next-round-btn').disabled = true;
  document.getElementById('generate-summary-btn').disabled = true;

  log(`討論開始: ${selected.join(' vs ')}`, 'success');

  for (const ai of selected) {
    await sendToAI(ai, `請就以下主題分享你的看法：\n\n${topic}`);
  }
}

function handleDiscussionResponse(aiType, content) {
  if (!discussionState.active) return;

  discussionState.history.push({
    round: discussionState.currentRound,
    ai: aiType,
    type: discussionState.roundType,
    content: content
  });

  discussionState.pendingResponses.delete(aiType);
  log(`討論: ${capitalize(aiType)} 已回覆 (第 ${discussionState.currentRound} 輪)`, 'success');

  if (discussionState.pendingResponses.size === 0) {
    onRoundComplete();
  } else {
    const remaining = Array.from(discussionState.pendingResponses).map(capitalize).join(', ');
    updateDiscussionStatus('waiting', `等待 ${remaining}...`);
  }
}

function onRoundComplete() {
  log(`第 ${discussionState.currentRound} 輪完成`, 'success');
  updateDiscussionStatus('ready', `第 ${discussionState.currentRound} 輪完成，可以進入下一輪`);

  document.getElementById('next-round-btn').disabled = false;
  document.getElementById('generate-summary-btn').disabled = false;
}

async function nextRound() {
  discussionState.currentRound++;
  const [ai1, ai2] = discussionState.participants;

  document.getElementById('round-badge').textContent = `第 ${discussionState.currentRound} 輪`;
  document.getElementById('next-round-btn').disabled = true;
  document.getElementById('generate-summary-btn').disabled = true;

  const prevRound = discussionState.currentRound - 1;
  const ai1Response = discussionState.history.find(
    h => h.round === prevRound && h.ai === ai1
  )?.content;
  const ai2Response = discussionState.history.find(
    h => h.round === prevRound && h.ai === ai2
  )?.content;

  if (!ai1Response || !ai2Response) {
    log('缺少上一輪的回覆內容', 'error');
    return;
  }

  discussionState.pendingResponses = new Set([ai1, ai2]);
  discussionState.roundType = 'cross-eval';

  updateDiscussionStatus('waiting', `交叉評價: ${capitalize(ai1)} 評價 ${capitalize(ai2)}，${capitalize(ai2)} 評價 ${capitalize(ai1)}...`);
  log(`第 ${discussionState.currentRound} 輪: 交叉評價開始`);

  const msg1 = `這是 ${capitalize(ai2)} 對於主題「${discussionState.topic}」的回應：

<${ai2}_response>
${ai2Response}
</${ai2}_response>

請評價這個回應。你同意什麼？不同意什麼？有什麼想補充或修改的？`;

  const msg2 = `這是 ${capitalize(ai1)} 對於主題「${discussionState.topic}」的回應：

<${ai1}_response>
${ai1Response}
</${ai1}_response>

請評價這個回應。你同意什麼？不同意什麼？有什麼想補充或修改的？`;

  await sendToAI(ai1, msg1);
  await sendToAI(ai2, msg2);
}

async function handleInterject() {
  const input = document.getElementById('interject-input');
  const message = input.value.trim();

  if (!message) {
    log('請輸入要傳送的訊息', 'error');
    return;
  }

  if (!discussionState.active || discussionState.participants.length === 0) {
    log('目前沒有進行中的討論', 'error');
    return;
  }

  const btn = document.getElementById('interject-btn');
  btn.disabled = true;

  const [ai1, ai2] = discussionState.participants;
  log(`[插話] 正在獲取雙方最新回覆...`);

  const ai1Response = await getLatestResponse(ai1);
  const ai2Response = await getLatestResponse(ai2);

  if (!ai1Response || !ai2Response) {
    log(`[插話] 無法獲取回應，請確保雙方都已回覆`, 'error');
    btn.disabled = false;
    return;
  }

  log(`[插話] 已獲取雙方回覆，正在傳送指令...`);

  const msg1 = `${message}

以下是 ${capitalize(ai2)} 的最新回覆：

<${ai2}_response>
${ai2Response}
</${ai2}_response>`;

  const msg2 = `${message}

以下是 ${capitalize(ai1)} 的最新回覆：

<${ai1}_response>
${ai1Response}
</${ai1}_response>`;

  await sendToAI(ai1, msg1);
  await sendToAI(ai2, msg2);

  log(`[插話] 已傳送給雙方（包含對方回覆內容）`, 'success');
  input.value = '';
  btn.disabled = false;
}

async function generateSummary() {
  document.getElementById('generate-summary-btn').disabled = true;
  updateDiscussionStatus('waiting', '正在請求雙方生成總結...');

  const [ai1, ai2] = discussionState.participants;
  let historyText = `主題: ${discussionState.topic}\n\n`;

  for (let round = 1; round <= discussionState.currentRound; round++) {
    historyText += `=== 第 ${round} 輪 ===\n\n`;
    const roundEntries = discussionState.history.filter(h => h.round === round);
    for (const entry of roundEntries) {
      historyText += `[${capitalize(entry.ai)}]:\n${entry.content}\n\n`;
    }
  }

  const summaryPrompt = `請對以下 AI 之間的討論進行總結。請包含：
1. 主要共識點
2. 主要分歧點
3. 各方的核心觀點
4. 總體結論

討論歷史：
${historyText}`;

  discussionState.roundType = 'summary';
  discussionState.pendingResponses = new Set([ai1, ai2]);

  log(`[總結] 正在請求雙方生成討論總結...`);
  await sendToAI(ai1, summaryPrompt);
  await sendToAI(ai2, summaryPrompt);

  const checkForSummary = setInterval(async () => {
    if (discussionState.pendingResponses.size === 0) {
      clearInterval(checkForSummary);
      const summaries = discussionState.history.filter(h => h.type === 'summary');
      const ai1Summary = summaries.find(s => s.ai === ai1)?.content || '';
      const ai2Summary = summaries.find(s => s.ai === ai2)?.content || '';

      log(`[總結] 雙方總結已生成`, 'success');
      showSummary(ai1Summary, ai2Summary);
    }
  }, 500);
}

function showSummary(ai1Summary, ai2Summary) {
  document.getElementById('discussion-active').classList.add('hidden');
  document.getElementById('discussion-summary').classList.remove('hidden');

  const [ai1, ai2] = discussionState.participants;

  if (!ai1Summary && !ai2Summary) {
    log('警告: 未收到 AI 的總結內容', 'error');
  }

  let html = `<div class="round-summary">
    <h4>雙方總結對比</h4>
    <div class="summary-comparison">
      <div class="ai-response">
        <div class="ai-name ${ai1}">${capitalize(ai1)} 的總結：</div>
        <div>${escapeHtml(ai1Summary).replace(/\n/g, '<br>')}</div>
      </div>
      <div class="ai-response">
        <div class="ai-name ${ai2}">${capitalize(ai2)} 的總結：</div>
        <div>${escapeHtml(ai2Summary).replace(/\n/g, '<br>')}</div>
      </div>
    </div>
  </div>`;

  html += `<div class="round-summary"><h4>完整討論歷史</h4>`;
  for (let round = 1; round <= discussionState.currentRound; round++) {
    const roundEntries = discussionState.history.filter(h => h.round === round && h.type !== 'summary');
    if (roundEntries.length > 0) {
      html += `<div style="margin-top:12px"><strong>第 ${round} 輪</strong></div>`;
      for (const entry of roundEntries) {
        const preview = entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : '');
        html += `<div class="ai-response">
          <div class="ai-name ${entry.ai}">${capitalize(entry.ai)}:</div>
          <div>${escapeHtml(preview).replace(/\n/g, '<br>')}</div>
        </div>`;
      }
    }
  }
  html += `</div>`;

  document.getElementById('summary-content').innerHTML = html;
  discussionState.active = false;
  log('討論總結已生成', 'success');
}

function endDiscussion() {
  if (confirm('確定結束討論嗎？建議先生成總結。')) {
    resetDiscussion();
  }
}

function resetDiscussion() {
  discussionState = {
    active: false,
    topic: '',
    participants: [],
    currentRound: 0,
    history: [],
    pendingResponses: new Set(),
    roundType: null
  };

  document.getElementById('discussion-setup').classList.remove('hidden');
  document.getElementById('discussion-active').classList.add('hidden');
  document.getElementById('discussion-summary').classList.add('hidden');
  document.getElementById('discussion-topic').value = '';
  document.getElementById('next-round-btn').disabled = true;
  document.getElementById('generate-summary-btn').disabled = true;

  log('討論已結束');
}

function updateDiscussionStatus(state, text) {
  const statusEl = document.getElementById('discussion-status');
  statusEl.textContent = text;
  statusEl.className = 'discussion-status ' + state;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// File Upload Functions
// ============================================

function setupFileUpload() {
  addFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => addFile(file));
    fileInput.value = '';
  });
}

function addFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    log(`檔案 ${file.name} 超過 10MB 限制`, 'error');
    return;
  }
  if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
    return;
  }
  selectedFiles.push(file);
  renderFileList();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
}

function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="file-name" title="${file.name}">${file.name}</span>
      <button class="remove-file" title="移除">&times;</button>
    `;
    item.querySelector('.remove-file').addEventListener('click', () => removeFile(index));
    fileList.appendChild(item);
  });
}

function clearFiles() {
  selectedFiles = [];
  renderFileList();
}

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        base64
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function sendFilesToAI(aiType, files) {
  log(`${capitalize(aiType)}: 準備上傳 ${files.length} 個檔案...`);
  const fileDataArray = await Promise.all(files.map(readFileAsBase64));
  log(`${capitalize(aiType)}: 檔案已編碼，正在傳送...`);

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'SEND_FILES', aiType, files: fileDataArray },
      (response) => {
        if (response?.success) {
          log(`${capitalize(aiType)}: 檔案上傳成功 (${files.length} 個)`, 'success');
        } else {
          log(`${capitalize(aiType)}: 檔案上傳失敗 - ${response?.error || '未知'}`, 'error');
        }
        resolve(response);
      }
    );
  });
}
