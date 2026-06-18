"use client";

type Props = {
  type: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
};

export default function AlertMessage({ type, message, onClose }: Props) {
  const colors = {
    error: "brutal-alert brutal-alert-error",
    success: "brutal-alert brutal-alert-success",
    info: "brutal-alert brutal-alert-info",
  };

  return (
    <div className={colors[type]}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="ml-4 text-sm opacity-70 hover:opacity-100">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
