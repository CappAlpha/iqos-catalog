import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/Button";
import { PageProgressBar } from "@/shared/ui/PageProgressBar";
import { StatusPage } from "@/shared/ui/StatusPage";

import { AppHeader } from "../../../layout/AppHeader";

export const ErrorPage = () => (
  <>
    <PageProgressBar state="idle" />
    <AppHeader />
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
