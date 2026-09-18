import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { buttonClass } from "./button-styles";

export function ButtonLink({
  to,
  children,
  variant = "primary",
  icon,
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  icon?: string;
}) {
  return (
    <Link to={to} className={buttonClass(variant)}>
      {icon ? <Icon name={icon} className="text-[18px]" /> : null}
      {children}
    </Link>
  );
}
