import clsx from "clsx";
import type { ReactNode } from "react";

import { NotFoundDevice } from "@/assets/icons";

import s from "./StatusPage.module.scss";

type TStatusPageVariant = "error" | "not-found";

interface IStatusPageProps {
  actions: ReactNode;
  description: ReactNode;
  eyebrow: string;
  title: ReactNode;
  variant: TStatusPageVariant;
}

export const StatusPage = ({
  actions,
  description,
  eyebrow,
  title,
  variant,
}: IStatusPageProps) => (
  <main className={clsx(s.root, s[variant])}>
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
