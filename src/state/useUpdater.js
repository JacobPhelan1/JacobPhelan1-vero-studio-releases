import { useCallback, useEffect, useState } from "react";

const INITIAL = { status: "initializing", detail: "Preparing VERO Studio…", version: "" };

export function useUpdater() {
  const desktop = window.veroDesktop;
  const [update, setUpdate] = useState(() => desktop ? INITIAL : { status: "development", detail: "Automatic updates are available in installed builds.", version: "" });

  useEffect(() => {
    let active = true;
    desktop?.getUpdateStatus?.().then((snapshot) => { if (active && snapshot) setUpdate(snapshot); });
    const unsubscribe = desktop?.onUpdateStatus?.((snapshot) => { if (active) setUpdate(snapshot); });
    return () => { active = false; unsubscribe?.(); };
  }, [desktop]);

  const check = useCallback(async () => {
    if (!desktop?.checkForUpdates) { setUpdate({ status: "development", detail: "Update checks are available in the installed desktop application.", version: "" }); return; }
    setUpdate({ status: "checking", detail: "Checking the VERO Studio release channel…", version: "" });
    try {
      const result = await desktop.checkForUpdates();
      if (result?.status) setUpdate({ status: result.status, detail: result.detail || result.reason || "Update check completed.", version: result.version || "" });
      else if (!result?.ok) setUpdate({ status: "error", detail: result?.reason || "The update service is currently unavailable.", version: "" });
    } catch (error) {
      setUpdate({ status: "error", detail: error?.message || "The update check could not be completed.", version: "" });
    }
  }, [desktop]);

  const install = useCallback(async () => {
    const result = await desktop?.installUpdate?.();
    if (!result?.ok) setUpdate({ status: "error", detail: result?.reason || "No update is ready to install.", version: "" });
  }, [desktop]);

  return { update, check, install, appVersion: desktop?.appVersion || "development" };
}
