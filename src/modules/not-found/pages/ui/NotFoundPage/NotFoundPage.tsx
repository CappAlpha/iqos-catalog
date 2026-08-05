import { NotFoundDevice } from "@/assets/icons";
import { TransitionNavLink } from "@/shared/ui/TransitionNavLink";

import s from "./NotFoundPage.module.scss";

export const NotFoundPage = () => (
  <main className={s.root}>
    <div className={s.content}>
      <div className={s.copy}>
        <span className={s.eyebrow}>Сигнал потерян</span>
        <h1 className={s.title}>404</h1>
        <p className={s.description}>
          Такой страницы нет. <br />
          Похоже, что-то пошло не так.
        </p>
        <TransitionNavLink to="/" className={s.link}>
          Вернуться в каталог
        </TransitionNavLink>
      </div>

      <div className={s.illustration}>
        <NotFoundDevice />
      </div>
    </div>
  </main>
);
