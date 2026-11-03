/**
 * Central configuration for GenAI models and settings
 */

export const GENAI_CONFIG = {
    
  // Default model for Live API connections

  // sadly not supported anymore :'(
  // gemini-live-2.5-flash-preview
  // models/gemini-2.0-flash-live-001
  // models/gemini-2.5-flash-native-audio-preview-09-2025
  // models/gemini-2.5-flash-preview-native-audio-dialog
  // models/gemini-live-2.5-flash-preview
  //gemini-2.5-flash-native-audio-preview-09-2025
  // Alternative models (kept for reference)
  //DEFAULT_MODEL: "gemini-2.5-flash-native-audio-preview-12-2025",
  DEFAULT_MODEL: "gemini-3.1-flash-live-preview",
} as const;
