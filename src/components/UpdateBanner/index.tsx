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
    <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-3">
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>

        {status === "available" && (
          <span>
            Version {updateInfo.version} available (current: {currentVersion})
          </span>
        )}

        {status === "downloading" && (
          <span className="flex items-center gap-2">
            Downloading... {downloadProgress}%
            <div className="w-24 h-1.5 bg-blue-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </span>
        )}

        {status === "ready" && (
          <span>Update ready to install (requires admin password)</span>
        )}

        {status === "installing" && (
          <span className="flex items-center gap-2">
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
          <span className="text-red-200">Update error: {error}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {status === "available" && (
          <button
            onClick={startDownload}
            className="px-3 py-1 bg-white text-blue-600 rounded font-medium hover:bg-blue-50 transition-colors"
          >
            Download
          </button>
        )}

        {status === "ready" && (
          <button
            onClick={startInstall}
            className="px-3 py-1 bg-white text-blue-600 rounded font-medium hover:bg-blue-50 transition-colors"
          >
            Install & Restart
          </button>
        )}

        {(status === "available" || status === "error") && (
          <button
            onClick={dismiss}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
            title="Dismiss"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
