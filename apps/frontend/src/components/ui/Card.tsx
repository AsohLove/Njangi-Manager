import { type HTMLAttributes, type ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-emerald-900/98 text-white p-4 pt-4 pb-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
