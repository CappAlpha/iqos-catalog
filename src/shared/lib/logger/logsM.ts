import { makeAutoObservable, observable } from "mobx";

import { IS_DEV } from "@/shared/config";

import type { IAppLogger, ILogEntry, TLogType } from "./types";

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const CONSOLE_LOG_LEVELS: readonly TLogType[] = IS_DEV
  ? ["info", "success", "warn", "error"]
  : ["warn", "error"];

class LogsM implements IAppLogger {
  logs: ILogEntry[] = [];
  private readonly maxLogsCount = 500;
  private logCounter = 0;

  constructor() {
    makeAutoObservable(this, {
      logs: observable.shallow,
    });
  }

  private readonly addLog = (
    type: TLogType,
    message: string,
    error?: string,
  ) => {
    this.logCounter++;
    const newEntry: ILogEntry = {
      id: `${Date.now()}-${this.logCounter}`,
      timestamp: new Date(),
      type,
      message,
      error,
    };

    this.logs.push(newEntry);
    if (this.logs.length > this.maxLogsCount) {
      this.logs.shift();
    }

    if (!CONSOLE_LOG_LEVELS.includes(type)) return;

    const time = timeFormatter.format(newEntry.timestamp);
    const consoleMsg = `[${time}] [${type.toUpperCase()}] ${message}`;

    if (type === "error") {
      console.error(consoleMsg, error ?? "");
    } else if (type === "warn") {
      console.warn(consoleMsg);
    } else if (type === "success") {
      console.log(`%c${consoleMsg}`, "color: #4caf50; font-weight: bold;");
    } else {
      console.log(consoleMsg);
    }
  };

  info = (msg: string) => this.addLog("info", msg);

  success = (msg: string) => this.addLog("success", msg);

  warn = (msg: string) => this.addLog("warn", msg);

  error = (msg: string, err?: unknown) => {
    let errStr = "";

    if (err instanceof Error) {
      errStr = err.stack ?? err.message;
    } else if (typeof err === "string") {
      errStr = err;
    } else if (
      typeof err === "number" ||
      typeof err === "boolean" ||
      typeof err === "symbol" ||
      typeof err === "bigint" ||
      typeof err === "function"
    ) {
      errStr = String(err);
    } else if (err !== null && err !== undefined) {
      const errObj = err as { toString?: unknown };
      try {
        errStr = JSON.stringify(errObj) ?? "";
      } catch {
        if (
          typeof errObj.toString === "function" &&
          errObj.toString !== Object.prototype.toString
        ) {
          errStr = (errObj as { toString(): string }).toString();
        } else {
          errStr = "[Unserializable Object]";
        }
      }
    }

    this.addLog("error", msg, errStr);
  };
}

export const logsM = new LogsM();
