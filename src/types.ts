/* AI Voice Exam modification notice: this file has been adapted locally.
 * Retains Apache-2.0 licensing; see THIRD_PARTY_NOTICES.md for provenance.
 */
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  GoogleGenAIOptions,
  LiveClientToolResponse,
  LiveServerMessage,
  Part,
} from "@google/genai";

/**
 * the options to initiate the client, ensure apiKey is required
 */
export type LiveClientOptions = GoogleGenAIOptions & { apiKey: string };

/** log types */
export type StreamingLog = {
  date: Date;
  type: string;
  count?: number;
  message:
    | string
    | ClientContentLog
    | Omit<LiveServerMessage, "text" | "data">
    | LiveClientToolResponse;
};

export type ClientContentLog = {
  turns: Part[];
  turnComplete: boolean;
};

/** Class type for teacher's classes */
export type Class = {
  id: string;
  title: string;
  description: string | null;
  schoolname: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  join_code?: string;
};

/** Class membership interface for student-class relationships */
export interface ClassMembership {
  id: string;
  class_id: string;
  user_id: string;
  joined_at: string;
  full_name?: string;
  school?: string;
}

/** Join code display component props */
export interface JoinCodeDisplayProps {
  joinCode: string;
  className?: string;
}
