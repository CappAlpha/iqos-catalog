import { useEffect } from "react";

import { checkApkUpdate } from "@/shared/lib/apkUpdater";

export default function ApkUpdaterToast() {
  useEffect(() => {
    void checkApkUpdate();
  }, []);

  return null;
}
