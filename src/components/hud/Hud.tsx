import { motion } from "framer-motion";
import type { CameraPresetId } from "../../content/cameraPresets";
import { useGardenStore } from "../../store/useGardenStore";
import { selectEnvironmentMode } from "../../store/selectors";
import { HudNavButton } from "./HudNavButton";

export function Hud() {
  const environmentMode = useGardenStore(selectEnvironmentMode);
  const isZombie = environmentMode === "zombie";
  const isDay = environmentMode === "day";

  const goToCameraPreset = useGardenStore((s) => s.goToCameraPreset);
  const openTerminal = useGardenStore((s) => s.openTerminal);
  const closeTerminal = useGardenStore((s) => s.closeTerminal);
  const openModal = useGardenStore((s) => s.openModal);
  const closeModal = useGardenStore((s) => s.closeModal);
  const toggleDayNight = useGardenStore((s) => s.toggleDayNight);
  const exitZombie = useGardenStore((s) => s.exitZombie);
  const recordCoffeeClick = useGardenStore((s) => s.recordCoffeeClick);

  const pan = (preset: CameraPresetId) => {
    closeModal();
    if (preset !== "terminal") closeTerminal();
    goToCameraPreset(preset);
  };

  const navMainDesktop = (
    <>
      <HudNavButton variant="desktop" icon="🏠" label="Garden" onClick={() => pan("hub")} />
      <HudNavButton variant="desktop" icon="🏡" label="About" onClick={() => pan("cottage")} />
      <HudNavButton variant="desktop" icon="🌱" label="Projects" onClick={() => pan("projects")} />
      <HudNavButton variant="desktop" icon="⌨️" label="Terminal" onClick={() => openTerminal()} />
      <HudNavButton variant="desktop" icon="📬" label="Mailbox" onClick={() => pan("mailbox")} />
      <HudNavButton variant="desktop" icon="💻" label="Resume" onClick={() => { closeTerminal(); openModal("resume"); }} />
      <HudNavButton variant="desktop" icon="✉️" label="Contact" onClick={() => { closeTerminal(); openModal("contact"); }} />
      <HudNavButton
        variant="desktop"
        icon="👤"
        label="Recruiter Mode"
        onClick={() => { closeTerminal(); openModal("recruiter"); }}
      />
    </>
  );

  const navCoffeeNightDesktop = !isZombie ? (
    <>
      <HudNavButton
        variant="desktop"
        icon="☕"
        label="Coffee"
        title="Coffee — three quick sips unlock Zombie Mode"
        onClick={() => recordCoffeeClick()}
      />
      <HudNavButton
        variant="desktop"
        icon={isDay ? "🌙" : "☀️"}
        label={isDay ? "Night mode" : "Day mode"}
        pressed={!isDay}
        onClick={() => toggleDayNight()}
      />
    </>
  ) : (
    <button
      type="button"
      onClick={() => exitZombie()}
      className="font-pixel min-h-[44px] shrink-0 rounded border-2 border-red-500/80 bg-ui-bg px-3 py-2 text-[7px] uppercase tracking-wide text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 sm:text-[8px]"
    >
      Exit Zombie Mode
    </button>
  );

  const navMainMobile = (
    <>
      <HudNavButton variant="mobile" icon="🏠" label="Garden" onClick={() => pan("hub")} />
      <HudNavButton variant="mobile" icon="🏡" label="About" onClick={() => pan("cottage")} />
      <HudNavButton variant="mobile" icon="🌱" label="Projects" onClick={() => pan("projects")} />
      <HudNavButton variant="mobile" icon="⌨️" label="Terminal" onClick={() => openTerminal()} />
      <HudNavButton variant="mobile" icon="📬" label="Mailbox" onClick={() => pan("mailbox")} />
      <HudNavButton variant="mobile" icon="💻" label="Resume" onClick={() => { closeTerminal(); openModal("resume"); }} />
      <HudNavButton variant="mobile" icon="✉️" label="Contact" onClick={() => { closeTerminal(); openModal("contact"); }} />
      <HudNavButton
        variant="mobile"
        icon="👤"
        label="Recruiter Mode"
        onClick={() => { closeTerminal(); openModal("recruiter"); }}
      />
    </>
  );

  const navCoffeeNightMobile = !isZombie ? (
    <>
      <HudNavButton
        variant="mobile"
        icon="☕"
        label="Coffee"
        title="Coffee — three quick sips unlock Zombie Mode"
        onClick={() => recordCoffeeClick()}
      />
      <HudNavButton
        variant="mobile"
        icon={isDay ? "🌙" : "☀️"}
        label={isDay ? "Night mode" : "Day mode"}
        pressed={!isDay}
        onClick={() => toggleDayNight()}
      />
    </>
  ) : (
    <button
      type="button"
      aria-label="Exit Zombie Mode"
      title="Exit Zombie Mode"
      onClick={() => exitZombie()}
      className="font-pixel flex h-11 min-w-[44px] items-center justify-center rounded border-2 border-red-500/80 bg-ui-bg px-2 text-[7px] uppercase leading-tight text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
    >
      Exit
    </button>
  );

  return (
    <>
      <motion.nav
        initial={false}
        aria-label="Main navigation"
        className="font-pixel fixed left-0 right-0 top-0 z-40 hidden max-h-[100dvh] border-b-2 border-ui-text/20 bg-ui-bg/95 shadow-sm backdrop-blur-sm md:block"
      >
        <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2">
            {navMainDesktop}
          </div>
          <div className="flex shrink-0 items-center justify-center gap-1.5 sm:gap-2">{navCoffeeNightDesktop}</div>
        </div>
      </motion.nav>

      <motion.nav
        initial={false}
        aria-label="Main navigation"
        className="font-pixel fixed bottom-0 left-0 right-0 z-40 border-t-2 border-ui-text/20 bg-ui-bg/95 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm md:hidden"
      >
        <div className="relative flex w-full max-w-[100vw] items-end overflow-x-auto overflow-y-visible pb-[env(safe-area-inset-bottom)] pl-1 pr-0">
          <div className="flex shrink-0 items-end gap-0.5 pr-1">{navMainMobile}</div>
          <div className="sticky right-0 z-[1] flex shrink-0 items-end gap-0.5 border-l border-ui-text/15 bg-ui-bg/95 py-0.5 pl-1.5 pr-1 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.12)] backdrop-blur-sm">
            {navCoffeeNightMobile}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
