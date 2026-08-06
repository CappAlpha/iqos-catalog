import cn from "classnames";
import type { ReactNode } from "react";

import { NotFoundDevice } from "@/assets/icons";

import s from "./StatusPage.module.scss";

type StatusPageVariant = "error" | "not-found";

interface StatusPageProps {
  actions: ReactNode;
  description: ReactNode;
  eyebrow: string;
  title: ReactNode;
  variant: StatusPageVariant;
}

export const StatusPage = ({
  actions,
  description,
  eyebrow,
  title,
  variant,
}: StatusPageProps) => (
  <main className={cn(s.root, s[variant])}>
    <div className={s.content}>
      <div className={s.copy}>
        <span className={s.eyebrow}>{eyebrow}</span>
        <h1 className={s.title}>{title}</h1>
        <p className={s.description}>{description}</p>
        <div className={s.actions}>{actions}</div>
      </div>

      <div className={s.illustration}>
        <NotFoundDevice />
      </div>
    </div>
  </main>
);
