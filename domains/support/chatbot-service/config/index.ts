/**
 * Configuration - Configuración centralizada del chatbot
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.CHATBOT_PORT || '3009', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // AI Provider Selection
  aiProvider: process.env.AI_PROVIDER || 'gemini', // 'ollama' | 'gemini' | 'fallback'

  // Ollama
  useOllama: process.env.USE_OLLAMA === 'true',
  ollamaHost: process.env.OLLAMA_HOST || 'http://ollama:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'phi3:mini',
  ollamaTimeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10),
  ollamaTemperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
  ollamaMaxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '1000', 10),

  // Gemini
  useGemini: process.env.USE_GEMINI === 'true',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  geminiTemperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
  geminiMaxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000', 10),

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/technovastore',

  // Ticket Service
  ticketServiceUrl: process.env.TICKET_SERVICE_URL || 'http://localhost:3005',

  // Session
  sessionMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  sessionCleanupInterval: 60 * 60 * 1000, // 1 hour

  // Context
  maxContextTokens: 1000,
  reservedTokensForResponse: 1000
};
