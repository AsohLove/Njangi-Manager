import { type HTMLAttributes, type ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-emerald-900 text-white p-4 pt-5 pb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
