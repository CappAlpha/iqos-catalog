import { ROUTES } from "@/shared/config";
import { StatusPage } from "@/shared/ui/StatusPage";
import { TransitionNavLink } from "@/shared/ui/TransitionNavLink";

export const NotFoundPage = () => (
  <StatusPage
    actions={
      <TransitionNavLink to={ROUTES.CATALOG}>
        Вернуться в каталог
      </TransitionNavLink>
    }
    description={
      <>
        Такой страницы нет. <br />
        Похоже, что-то пошло не так.
      </>
    }
    eyebrow="Сигнал потерян"
    title="404"
    variant="not-found"
  />
);
