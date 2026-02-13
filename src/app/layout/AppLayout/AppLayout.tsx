import { type ReactNode } from 'react';
import s from './AppLayout.module.scss';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className={s.root}>
      {children}
    </div>
  );
};