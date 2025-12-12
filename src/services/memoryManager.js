// Memory Manager
// Manages memory.json for learning and improvement

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MEMORY_KEY = 'konsultabot_memory';

export class MemoryManager {
  constructor() {
    this.memory = {
      general_facts: [],
      common_questions: [],
      learned_fixes: [],
      past_failures: []
    };
  }

  // Load memory from storage
  async loadMemory() {
    try {
      const stored = await AsyncStorage.getItem(MEMORY_KEY);
      if (stored) {
        this.memory = JSON.parse(stored);
        return this.memory;
      }
    } catch (error) {
      console.log('Error loading memory:', error);
    }
    return this.memory;
  }

  // Save memory to storage
  async saveMemory() {
    try {
      await AsyncStorage.setItem(MEMORY_KEY, JSON.stringify(this.memory));
      return true;
    } catch (error) {
      console.log('Error saving memory:', error);
      return false;
    }
  }

  // Add general fact
  async addGeneralFact(fact, source = 'user') {
    this.memory.general_facts.push({
      fact,
      source,
      date: new Date().toISOString()
    });
    await this.saveMemory();
  }

  // Add common question
  async addCommonQuestion(question) {
    const existing = this.memory.common_questions.find(q => 
      q.question.toLowerCase() === question.toLowerCase()
    );

    if (existing) {
      existing.frequency += 1;
      existing.last_asked = new Date().toISOString();
    } else {
      this.memory.common_questions.push({
        question,
        frequency: 1,
        last_asked: new Date().toISOString()
      });
    }
    await this.saveMemory();
  }

  // Add learned fix
  async addLearnedFix(issue, solution, successRate = 0.5, verified = false) {
    this.memory.learned_fixes.push({
      issue,
      solution,
      success_rate: successRate,
      verified,
      date: new Date().toISOString()
    });
    await this.saveMemory();
  }

  // Add past failure
  async addPastFailure(userMessage, botResponse, issue, correctResponse) {
    this.memory.past_failures.push({
      user_message: userMessage,
      bot_response: botResponse,
      issue,
      correct_response: correctResponse,
      date: new Date().toISOString()
    });
    await this.saveMemory();
  }

  // Get learned fix for an issue
  getLearnedFix(issue) {
    const lowerIssue = issue.toLowerCase();
    const matches = this.memory.learned_fixes.filter(fix => 
      fix.issue.toLowerCase().includes(lowerIssue) ||
      lowerIssue.includes(fix.issue.toLowerCase())
    );

    if (matches.length > 0) {
      // Return most verified and highest success rate
      matches.sort((a, b) => {
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        return b.success_rate - a.success_rate;
      });
      return matches[0];
    }
    return null;
  }

  // Check if question is common
  isCommonQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    return this.memory.common_questions.some(q => 
      q.question.toLowerCase() === lowerQuestion && q.frequency >= 3
    );
  }

  // Get similar past failures
  getSimilarFailures(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    return this.memory.past_failures.filter(failure => {
      const lowerUserMsg = failure.user_message.toLowerCase();
      // Simple similarity check
      const words = lowerMessage.split(/\s+/);
      const matchCount = words.filter(word => 
        word.length > 3 && lowerUserMsg.includes(word)
      ).length;
      return matchCount >= 2;
    });
  }

  // Get memory summary for AI context
  getMemorySummary() {
    const summary = [];
    
    if (this.memory.general_facts.length > 0) {
      summary.push(`General Facts: ${this.memory.general_facts.length} entries`);
    }
    
    if (this.memory.common_questions.length > 0) {
      const topQuestions = this.memory.common_questions
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(q => q.question);
      summary.push(`Common Questions: ${topQuestions.join(', ')}`);
    }
    
    if (this.memory.learned_fixes.length > 0) {
      summary.push(`Learned Fixes: ${this.memory.learned_fixes.length} solutions`);
    }
    
    return summary.join('\n');
  }

  // Clear memory (for testing)
  async clearMemory() {
    this.memory = {
      general_facts: [],
      common_questions: [],
      learned_fixes: [],
      past_failures: []
    };
    await this.saveMemory();
  }
}

export const memoryManager = new MemoryManager();

