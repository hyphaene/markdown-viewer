import { useUpdateChecker } from "../../hooks/useUpdateChecker";

export function UpdateBanner() {
  const {
    status,
    updateInfo,
    currentVersion,
    error,
    downloadProgress,
    dismiss,
    startDownload,
    startInstall,
  } = useUpdateChecker();

  // Don't show anything if idle, checking, or no update
  if (status === "idle" || status === "checking" || !updateInfo) {
    return null;
  }

  return (
    <div className="bg-accent text-background px-4 py-2.5 flex items-center justify-between text-sm">
      <div className="flex items-center gap-3">
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>

        {status === "available" && (
          <span className="font-medium">
            Version {updateInfo.version} available (current: {currentVersion})
          </span>
        )}

        {status === "downloading" && (
          <span className="flex items-center gap-3 font-medium">
            Downloading... {downloadProgress}%
            <div className="w-24 h-1.5 bg-background/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-background transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </span>
        )}

        {status === "ready" && (
          <span className="font-medium">
            Update ready to install (requires admin password)
          </span>
        )}

        {status === "installing" && (
          <span className="flex items-center gap-2 font-medium">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Installing...
          </span>
        )}

        {status === "error" && (
          <span className="text-background/80">Update error: {error}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {status === "available" && (
          <button
            onClick={startDownload}
            className="px-4 py-1.5 bg-background text-accent rounded-lg font-medium hover:bg-background/90 transition-colors"
          >
            Download
          </button>
        )}

        {status === "ready" && (
          <button
            onClick={startInstall}
            className="px-4 py-1.5 bg-background text-accent rounded-lg font-medium hover:bg-background/90 transition-colors"
          >
            Install & Restart
          </button>
        )}

        {(status === "available" || status === "error") && (
          <button
            onClick={dismiss}
            className="p-1.5 hover:bg-background/20 rounded-lg transition-colors"
            title="Dismiss"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
