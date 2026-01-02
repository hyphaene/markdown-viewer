import { useState, useEffect, useCallback, useRef } from "react";
import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getCurrentAppVersion,
} from "../lib/tauri";
import type { UpdateInfo } from "../types";

const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "installing"
  | "error";

interface UseUpdateCheckerReturn {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  currentVersion: string;
  error: string | null;
  downloadProgress: number;
  dismiss: () => void;
  startDownload: () => Promise<void>;
  startInstall: () => Promise<void>;
  checkNow: () => Promise<void>;
}

export function useUpdateChecker(): UseUpdateCheckerReturn {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const dmgPathRef = useRef<string | null>(null);

  const checkNow = useCallback(async () => {
    if (status === "downloading" || status === "installing") return;

    setStatus("checking");
    setError(null);

    try {
      const info = await checkForUpdates();
      if (info && info.version !== dismissed) {
        setUpdateInfo(info);
        setStatus("available");
      } else {
        setStatus("idle");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [status, dismissed]);

  const startDownload = useCallback(async () => {
    if (!updateInfo) return;

    setStatus("downloading");
    setDownloadProgress(0);
    setError(null);

    try {
      // Simulate progress (reqwest doesn't have easy progress tracking)
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const dmgPath = await downloadUpdate(updateInfo.download_url);
      clearInterval(progressInterval);
      setDownloadProgress(100);
      dmgPathRef.current = dmgPath;
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [updateInfo]);

  const startInstall = useCallback(async () => {
    if (!dmgPathRef.current) return;

    setStatus("installing");
    setError(null);

    try {
      await installUpdate(dmgPathRef.current);
      // App will quit and relaunch, so this line may never execute
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, []);

  const dismiss = useCallback(() => {
    if (updateInfo) {
      setDismissed(updateInfo.version);
    }
    setStatus("idle");
    setUpdateInfo(null);
  }, [updateInfo]);

  // Load current version on mount
  useEffect(() => {
    getCurrentAppVersion().then(setCurrentVersion).catch(console.error);
  }, []);

  // Initial check on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      checkNow();
    }, 3000); // Delay initial check by 3s to not slow down startup

    return () => clearTimeout(timer);
  }, []);

  // Periodic check every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === "idle" || status === "error") {
        checkNow();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status, checkNow]);

  return {
    status,
    updateInfo,
    currentVersion,
    error,
    downloadProgress,
    dismiss,
    startDownload,
    startInstall,
    checkNow,
  };
}
