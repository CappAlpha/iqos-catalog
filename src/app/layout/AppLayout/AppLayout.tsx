import { type ReactNode } from 'react';
import s from './AppLayout.module.scss';
import { Header } from '../../../shared/ui/Header';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className={s.root}>
      <Header />
      {children}
    </div>
  );
};