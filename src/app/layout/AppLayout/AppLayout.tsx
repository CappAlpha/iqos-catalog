import { type ReactNode } from "react";

import { Header } from "@/shared/ui/Header";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};
