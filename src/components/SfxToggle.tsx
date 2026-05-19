import { useEffect, useState } from "react";
import {
  initMilitarySounds,
  isMilitarySoundsEnabled,
  setMilitarySoundsEnabled,
  playRadioSquawk,
} from "@/lib/military-sounds";

export function SfxToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    initMilitarySounds();
    setOn(isMilitarySoundsEnabled());
  }, []);

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-[10px] tracking-widest opacity-80 hover:opacity-100">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          const next = e.target.checked;
          setMilitarySoundsEnabled(next);
          setOn(next);
          if (next) playRadioSquawk();
        }}
        className="accent-(--color-gold) size-3"
      />
      <span>EFEITOS SONOROS</span>
    </label>
  );
}
