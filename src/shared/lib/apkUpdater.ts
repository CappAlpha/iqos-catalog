import { App } from "@capacitor/app";
import { FileTransfer } from "@capacitor/file-transfer";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capawesome-team/capacitor-file-opener";

import { GITHUB_RELEASES_API } from "@/shared/config";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";

const VERSION_REGEX = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/;

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name?: string;
  assets?: GitHubAsset[];
}

let isDownloadInProgress = false;

const parseVersion = (version: string): [number, number, number] | null => {
  const match = VERSION_REGEX.exec(version);
  return match
    ? [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)]
    : null;
};

const isNewerVersion = (
  remoteVersion: string,
  currentVersion: string,
): boolean => {
  const remote = parseVersion(remoteVersion);
  const current = parseVersion(currentVersion);

  if (!remote || !current) return false;

  for (let index = 0; index < remote.length; index += 1) {
    if (remote[index] !== current[index]) {
      return remote[index] > current[index];
    }
  }
  return false;
};

const downloadAndInstall = async (
  downloadUrl: string,
  version: string,
): Promise<void> => {
  if (isDownloadInProgress) return;

  try {
    isDownloadInProgress = true;

    customToastTemplate({
      title: "Скачивание обновления...",
      type: "info",
      description: "Пожалуйста, подождите. Установщик откроется автоматически.",
      duration: 15_000,
      position: "bottom-right",
    });

    const fileName = `update-${version}.apk`;
    const fileInfo = await Filesystem.getUri({
      directory: Directory.Cache,
      path: fileName,
    });

    const downloadResult = await FileTransfer.downloadFile({
      url: downloadUrl,
      path: fileInfo.uri,
    });

    if (downloadResult?.path) {
      await FileOpener.openFile({
        path: downloadResult.path,
        mimeType: "application/vnd.android.package-archive",
      });
    }
  } catch (error) {
    console.error("Ошибка при установке APK:", error);
    customToastTemplate({
      title: "Ошибка обновления",
      type: "error",
      description: "Не удалось скачать файл. Попробуйте позже.",
      duration: 5_000,
      position: "bottom-right",
    });
  } finally {
    isDownloadInProgress = false;
  }
};

export const checkApkUpdate = async (): Promise<void> => {
  try {
    const cacheResult = await Filesystem.readdir({
      path: "",
      directory: Directory.Cache,
    });

    for (const file of cacheResult.files) {
      const fileName = typeof file === "string" ? file : file.name;
      if (fileName?.endsWith(".apk")) {
        await Filesystem.deleteFile({
          path: fileName,
          directory: Directory.Cache,
        });
      }
    }
  } catch {
    // Nothing to catch
  }

  try {
    const appInfo = await App.getInfo();
    const response = await fetch(GITHUB_RELEASES_API);

    if (!response.ok) return;

    const release = (await response.json()) as unknown as GitHubRelease;
    if (!release?.tag_name) return;

    const remoteVersion = release.tag_name.replace(/^v/, "");

    if (isNewerVersion(remoteVersion, appInfo.version)) {
      const apkAsset = release.assets?.find((asset) =>
        asset.name.endsWith(".apk"),
      );

      if (apkAsset?.browser_download_url) {
        const downloadUrl = apkAsset.browser_download_url;

        customToastTemplate({
          title: `Доступна версия v${remoteVersion}`,
          type: "info",
          description: "Нажмите кнопку для установки обновления.",
          buttonLabel: "Обновить",
          action: () => {
            void downloadAndInstall(downloadUrl, remoteVersion);
          },
          duration: 60_000,
          position: "bottom-right",
        });
      }
    }
  } catch (error) {
    console.error("Ошибка проверки обновлений:", error);
  }
};
