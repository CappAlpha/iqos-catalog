import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/Button";
import { Header } from "@/shared/ui/Header";
import { StatusPage } from "@/shared/ui/StatusPage";

export const ErrorPage = () => (
  <>
    <Header />
    <StatusPage
      actions={
        <>
          <Button onClick={() => window.location.reload()}>
            Обновить страницу
          </Button>
          <Button color="transparent" to={ROUTES.CATALOG}>
            Вернуться в каталог
          </Button>
        </>
      }
      description={
        <>
          Что-то пошло не так. <br />
          Попробуйте обновить страницу или вернуться в каталог.
        </>
      }
      eyebrow="Связь прервана"
      title="Упс"
      variant="error"
    />
  </>
);
