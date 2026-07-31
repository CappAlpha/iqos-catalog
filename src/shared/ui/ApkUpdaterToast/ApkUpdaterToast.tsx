import { useEffect } from "react";

import { useApkUpdate } from "@/shared/hooks/useApkUpdate";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";

export default function ApkUpdaterToast() {
  const { updateAvailable, latestVersion, installUpdate } = useApkUpdate();

  useEffect(() => {
    if (updateAvailable && latestVersion) {
      customToastTemplate({
        title: `Доступна версия v${latestVersion}`,
        type: "info",
        description: "Нажмите кнопку ниже для установки обновлений.",
        buttonLabel: "Обновить",
        action: () => installUpdate(),
        duration: 60_000,
        position: "bottom-right",
      });
    }
  }, [updateAvailable, latestVersion, installUpdate]);

  return null;
}
