import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISSUE_LIBRARY } from '../data/offlineKnowledgeIssues';

const ISSUE_COUNT_PREFIX = '@konsultabot_issue_counts_';
const LOG_STORAGE_PREFIX = '@konsultabot_kb_logs_';
const ESCALATION_LIMIT = 10;
const MAX_LOG_ENTRIES = 200;

const sanitize = (text = '') => text.toLowerCase().trim();

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const stringify = (value, fallback = '[]') => {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return fallback;
  }
};

const computeScore = (text, keywords = []) => {
  let score = 0;
  keywords.forEach(keyword => {
    if (keyword && text.includes(keyword)) {
      score += 1;
    }
  });
  return score;
};

const getUserId = (profile) => {
  return profile?.id?.toString() ||
    profile?.user_id?.toString() ||
    profile?.username ||
    'anonymous';
};

const getDisplayName = (profile = {}) => {
  const nameParts = [
    profile.first_name || profile.firstName,
    profile.middle_name || profile.middleName,
    profile.last_name || profile.lastName
  ].filter(part => typeof part === 'string' && part.trim().length > 0);

  if (nameParts.length > 0) {
    return nameParts.join(' ').replace(/\s+/g, ' ').trim();
  }

  return (
    profile.full_name ||
    profile.preferredName ||
    profile.displayName ||
    profile.username ||
    profile.email ||
    null
  );
};

export const matchKnowledgeBaseIssue = (query) => {
  const normalized = sanitize(query);
  if (!normalized) return null;

  let bestMatch = null;
  let bestScore = 0;

  ISSUE_LIBRARY.forEach(issue => {
    const score = computeScore(normalized, issue.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = issue;
    }
  });

  if (!bestMatch) {
    return null;
  }

  return {
    issue: bestMatch,
    score: bestScore
  };
};

export const formatIssueResponse = (issue, userProfile = {}) => {
  const name = getDisplayName(userProfile);
  const greeting = name ? `Hi ${name}, ` : 'Hi there, ';
  const steps = issue.steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');

  return `${greeting}${issue.summary}\n\nQuick steps:\n${steps}\n\nNeed more help? Let me know which step you’re on.`;
};

const getUsageMap = async (userId) => {
  const key = `${ISSUE_COUNT_PREFIX}${userId}`;
  const raw = await AsyncStorage.getItem(key);
  return safeParse(raw, {});
};

const saveUsageMap = async (userId, map) => {
  const key = `${ISSUE_COUNT_PREFIX}${userId}`;
  await AsyncStorage.setItem(key, stringify(map, '{}'));
};

export const incrementIssueUsage = async (userId, issueKey) => {
  if (!userId || !issueKey) return;
  try {
    const map = await getUsageMap(userId);
    map[issueKey] = (map[issueKey] || 0) + 1;
    await saveUsageMap(userId, map);
  } catch (error) {
    console.log('KB usage increment error:', error.message);
  }
};

export const shouldEscalateIssue = async (userId, issueKey) => {
  if (!userId || !issueKey) return false;
  try {
    const map = await getUsageMap(userId);
    const count = map[issueKey] || 0;
    return count >= (ESCALATION_LIMIT - 1);
  } catch (error) {
    console.log('KB escalate check error:', error.message);
    return false;
  }
};

export const recordKnowledgeInteraction = async ({
  userId,
  userName,
  userMessage,
  botMessage,
  issueKey,
  source
}) => {
  const id = userId || 'anonymous';
  const key = `${LOG_STORAGE_PREFIX}${id}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    const logs = safeParse(raw, []);
    logs.push({
      timestamp: new Date().toISOString(),
      userName: userName || null,
      userMessage,
      botMessage,
      issueKey: issueKey || null,
      source: source || 'offline_kb'
    });

    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(0, logs.length - MAX_LOG_ENTRIES);
    }

    await AsyncStorage.setItem(key, stringify(logs, '[]'));
  } catch (error) {
    console.log('KB log error:', error.message);
  }
};

export const getSavedConversations = async (userId = 'anonymous') => {
  const key = `${LOG_STORAGE_PREFIX}${userId}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    return safeParse(raw, []);
  } catch (error) {
    console.log('KB fetch log error:', error.message);
    return [];
  }
};

export const clearSavedConversations = async (userId = 'anonymous') => {
  const key = `${LOG_STORAGE_PREFIX}${userId}`;
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log('KB clear log error:', error.message);
  }
};

const getFallbackResponse = () => ({
  answer: "I can help with that! Could you share a few more details so I can match the right fix? I cover passwords, hardware, software, printers, and network issues even while offline.",
  confidence: 0.5,
  source: 'offline_kb',
  issueKey: null,
  escalate: false
});

export const searchKnowledgeBase = async (query, userProfile = {}) => {
  const match = matchKnowledgeBaseIssue(query);
  if (!match) {
    return getFallbackResponse();
  }

  const userId = getUserId(userProfile);
  const displayName = getDisplayName(userProfile);
  const escalate = await shouldEscalateIssue(userId, match.issue.key);

  let answer;
  if (escalate) {
    answer = `You've already tried my offline fixes for ${match.issue.title}. Let me escalate this so Gemini can dig deeper the next time you ask.`;
  } else {
    answer = formatIssueResponse(match.issue, { ...userProfile, displayName });
    await incrementIssueUsage(userId, match.issue.key);
  }

  await recordKnowledgeInteraction({
    userId,
    userName: displayName,
    userMessage: query,
    botMessage: answer,
    issueKey: match.issue.key,
    source: escalate ? 'needs_gemini' : 'offline_kb'
  });

  return {
    answer,
    confidence: Math.min(0.65 + (match.score * 0.05), 0.95),
    source: escalate ? 'needs_gemini' : 'offline_kb',
    issueKey: match.issue.key,
    issueTitle: match.issue.title,
    escalate
  };
};

export const getRandomTip = () => {
  const tips = [
    '💡 Tip: Keep your files organized in folders for easy access!',
    '📚 Tip: Take breaks every 25 minutes when studying (Pomodoro technique)!',
    '🔒 Tip: Use strong passwords with numbers, letters, and symbols!',
    '☕ Tip: Stay hydrated and take care of your health while studying!',
    '📱 Tip: Turn off notifications when you need to focus!',
    '💾 Tip: Always back up your important files!',
    '🎯 Tip: Set specific, achievable goals for your study sessions!',
    '🌙 Tip: Get 7-8 hours of sleep for better academic performance!'
  ];

  return tips[Math.floor(Math.random() * tips.length)];
};

export const KB_CONSTANTS = {
  ESCALATION_LIMIT,
  MAX_LOG_ENTRIES
};

