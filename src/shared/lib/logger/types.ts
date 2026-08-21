export type TLogType = "info" | "success" | "warn" | "error";

export interface ILogEntry {
  id: string;
  timestamp: Date;
  type: TLogType;
  message: string;
  error?: string | undefined;
}

export interface IAppLogger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}
