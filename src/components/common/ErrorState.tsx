import { Icon } from "@/components/Icon";
import { buttonClass } from "./button-styles";

export function ErrorState({
  title = "Could not load data",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-critical/30 bg-critical/10 px-6 py-10 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-critical/10 text-critical">
        <Icon name="error" className="text-[24px]" />
      </span>
      <h3 className="mt-3 font-display text-base font-semibold text-critical">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-foreground/70">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={`mt-4 ${buttonClass("ghost")}`}>
          <Icon name="refresh" className="text-[18px]" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
