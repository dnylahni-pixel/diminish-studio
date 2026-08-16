import * as React from "react";
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import { transitionFast } from "./shared";

/* ---------------------------------------------------------------------
   File Upload (button-triggered)
   --------------------------------------------------------------------- */
export function FileUpload({
  label = "Upload a file",
  hint = "PDF, PNG or JPG up to 10MB",
  onFiles,
  disabled,
}: {
  label?: string;
  hint?: string;
  onFiles?: (files: FileList) => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-[var(--shadow-xs)] hover:bg-neutral-50",
          "disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
          transitionFast,
        )}
      >
        <UploadCloud className="size-[var(--size-icon-sm)] text-neutral-400" />
        {label}
      </button>
      <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(e) => e.target.files && onFiles?.(e.target.files)}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------
   Dropzone
   --------------------------------------------------------------------- */
export function Dropzone({
  onFiles,
  disabled,
  state = "default",
}: {
  onFiles?: (files: FileList) => void;
  disabled?: boolean;
  state?: "default" | "error" | "success";
}) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const stateStyles = {
    default: "border-neutral-300",
    error: "border-danger-300 bg-danger-50/40",
    success: "border-success-300 bg-success-50/40",
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled && e.dataTransfer.files) onFiles?.(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-10 text-center cursor-pointer",
        stateStyles[state],
        dragging && "border-primary-400 bg-primary-50/50",
        disabled && "opacity-[var(--opacity-disabled)] pointer-events-none",
        transitionFast,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
        <UploadCloud className="size-5 text-neutral-500" />
      </div>
      <p className="text-sm font-medium text-neutral-700">
        <span className="text-primary-600">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-neutral-400">Any file type, up to 10MB</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => e.target.files && onFiles?.(e.target.files)}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------
   File row (uploaded item display, states: uploading / success / error)
   --------------------------------------------------------------------- */
export function FileItem({
  name,
  size,
  progress,
  state = "default",
  onRemove,
}: {
  name: string;
  size?: string;
  progress?: number;
  state?: "default" | "uploading" | "success" | "error";
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 px-3.5 py-3 shadow-[var(--shadow-xs)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-neutral-100 text-neutral-500">
        <File className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-800">{name}</p>
        {state === "uploading" ? (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress ?? 0}%` }} />
          </div>
        ) : (
          <p className="text-xs text-neutral-400">{size}</p>
        )}
      </div>
      {state === "success" && <CheckCircle2 className="size-4 shrink-0 text-success-500" />}
      {state === "error" && <AlertCircle className="size-4 shrink-0 text-danger-500" />}
      {onRemove && (
        <button onClick={onRemove} className="shrink-0 text-neutral-400 hover:text-neutral-700" aria-label="Remove file">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   OTP Input
   --------------------------------------------------------------------- */
export function OtpInput({
  length = 6,
  value,
  onChange,
  state = "default",
  disabled,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  state?: "default" | "error" | "success";
  disabled?: boolean;
}) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("");

  const setDigit = (index: number, char: string) => {
    const next = value.split("");
    next[index] = char;
    onChange(next.join("").slice(0, length));
  };

  const stateBorder = {
    default: "border-neutral-200 focus:border-primary-400",
    error: "border-danger-300",
    success: "border-success-300",
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digits[i] ?? ""}
          disabled={disabled}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            setDigit(i, char);
            if (char && refs.current[i + 1]) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && refs.current[i - 1]) {
              refs.current[i - 1]?.focus();
            }
          }}
          inputMode="numeric"
          maxLength={1}
          className={cn(
            "size-11 rounded-[var(--radius-md)] border bg-neutral-0 text-center text-lg font-semibold text-neutral-900 shadow-[var(--shadow-xs)] outline-none",
            "focus:ring-[3px] focus:ring-primary-100",
            "disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
            stateBorder[state],
            transitionFast,
          )}
        />
      ))}
    </div>
  );
}
