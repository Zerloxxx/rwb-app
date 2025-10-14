import { useEffect, useState } from "react";
import { getPiggyOverview, PIGGY_UPDATED_EVENT, STORAGE_KEY_CURRENT } from "../utils/piggyStorage";

const readOverview = () => getPiggyOverview();

export default function usePiggyOverview() {
  const [overview, setOverview] = useState(readOverview);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const sync = () => setOverview(readOverview());
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    };
    const handleStorage = (event) => {
      if (!event.key || event.key === STORAGE_KEY_CURRENT || event.key.startsWith("wbkids.piggies")) {
        sync();
      }
    };

    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(PIGGY_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PIGGY_UPDATED_EVENT, sync);
    };
  }, []);

  return overview;
}
