import { App } from "@capacitor/app";
import { FileTransfer } from "@capacitor/file-transfer";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capawesome-team/capacitor-file-opener";
import { useState, useEffect, useCallback, useRef } from "react";

const GITHUB_REPO = "CappAlpha/iqos-catalog";

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: GitHubAsset[];
}

const parseVersion = (version: string) => {
  const match = version.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/);

  return match
    ? [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)]
    : null;
};

const isNewerVersion = (remoteVersion: string, currentVersion: string) => {
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

export const useApkUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [latestVersion, setLatestVersion] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const downloadInProgressRef = useRef(false);

  const installUpdate = useCallback(async () => {
    if (!downloadUrl || !latestVersion || downloadInProgressRef.current) return;
    const fileName = `update-${latestVersion}.apk`;

    try {
      downloadInProgressRef.current = true;
      setIsDownloading(true);

      const fileInfo = await Filesystem.getUri({
        directory: Directory.Cache,
        path: fileName,
      });

      const downloadResult = await FileTransfer.downloadFile({
        url: downloadUrl,
        path: fileInfo.uri,
      });

      if (downloadResult.path) {
        await FileOpener.openFile({
          path: downloadResult.path,
          mimeType: "application/vnd.android.package-archive",
        });
      }
    } catch (error) {
      console.error("Ошибка при скачивании или установке APK:", error);
    } finally {
      downloadInProgressRef.current = false;
      setIsDownloading(false);
    }
  }, [downloadUrl, latestVersion]);

  useEffect(() => {
    // TODO: move startup logic to initial hook if needed
    let ignore = false;

    const initUpdateCheck = async () => {
      try {
        const cacheResult = await Filesystem.readdir({
          path: "",
          directory: Directory.Cache,
        });

        for (const file of cacheResult.files) {
          if (file.name.endsWith(".apk")) {
            await Filesystem.deleteFile({
              path: file.name,
              directory: Directory.Cache,
            });
          }
        }

        const appInfo = await App.getInfo();
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        );
        const release = (await response.json()) as GitHubRelease;
        const remoteVersion = release.tag_name.replace(/^v/, "");

        if (!ignore && isNewerVersion(remoteVersion, appInfo.version)) {
          const apkAsset = release.assets?.find((asset) =>
            asset.name.endsWith(".apk"),
          );
          if (apkAsset?.browser_download_url) {
            setLatestVersion(remoteVersion);
            setDownloadUrl(apkAsset.browser_download_url);
            setUpdateAvailable(true);
          }
        }
      } catch (error) {
        console.error("Ошибка проверки обновлений:", error);
      }
    };

    void initUpdateCheck();

    return () => {
      ignore = true;
    };
  }, []);

  return {
    updateAvailable,
    latestVersion,
    isDownloading,
    installUpdate,
  };
};
