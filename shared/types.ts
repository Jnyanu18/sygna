/** Shared DTOs for SYGNA client ↔ server (extend as the UI grows). */

export type SygnaTaskDTO = {
  id: string;
  error: string;
  file: string;
  stack: string;
  status: string;
  stage: string;
  createdAt: string;
};

export type SentryWebhookAck = {
  received: boolean;
  taskId?: string;
  error?: string;
};
