import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type MetricValueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: string | number;
  maxSize?: number;
};

export function MetricValue({ value, maxSize = 2, className, style, ...props }: MetricValueProps) {
  const display = String(value);
  const characters = Math.max(3, Array.from(display).length);
  return (
    <span
      className={cn("gwero-metric-frame", className)}
      style={
        {
          "--gwero-metric-fluid": `${150 / characters}cqw`,
          "--gwero-metric-max": `${maxSize}rem`,
          ...style,
        } as CSSProperties
      }
      title={props.title || display}
      {...props}
    >
      <span className="gwero-metric-value">{display}</span>
    </span>
  );
}
