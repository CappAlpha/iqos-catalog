import { type ReactNode } from "react";

import { Header } from "../../../shared/ui/Header";

import s from "./AppLayout.module.scss";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className={s.root}>
      <Header />
      {children}
    </div>
  );
};
