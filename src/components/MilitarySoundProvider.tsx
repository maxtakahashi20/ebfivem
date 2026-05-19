import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  initMilitarySounds,
  isMilitarySoundsEnabled,
  playHoverThrottled,
  playTerminalClick,
  playRadioSquawk,
} from "@/lib/military-sounds";

/** Ativa SFX leves em botões e links do site público */
export function MilitarySoundProvider() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPath = useRef(pathname);

  useEffect(() => {
    initMilitarySounds();
    if (!isMilitarySoundsEnabled()) return;
    if (prevPath.current !== pathname && !/^\/admcmf/i.test(pathname)) {
      playRadioSquawk();
    }
    prevPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    initMilitarySounds();
    if (!isMilitarySoundsEnabled()) return;

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(".admcmf-shell, [data-sfx-off]")) return;
      if (t.closest("button, .btn-olive, .btn-ghost-olive, a.tag-rank")) {
        playTerminalClick();
      }
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(".admcmf-shell, [data-sfx-off]")) return;
      if (t.closest("button, .btn-olive, .btn-ghost-olive, a[href]")) {
        playHoverThrottled();
      }
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("mouseover", onOver, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseover", onOver, true);
    };
  }, []);

  return null;
}
