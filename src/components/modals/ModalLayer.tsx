import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { getProjectById } from "../../content/projectsList";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useGardenStore } from "../../store/useGardenStore";
import { selectActiveModal, selectActiveProjectId } from "../../store/selectors";
import type { ModalId } from "../../types";
import { CottageSectionPanel } from "./CottageSectionPanel";
import { ProjectDetailPanel } from "./ProjectDetailPanel";

const ContactForm = dynamic(() => import("./ContactForm").then((m) => ({ default: m.ContactForm })), {
  ssr: false,
  loading: () => (
    <p className="animate-pulse text-sm text-ui-text/70" role="status">
      Loading contact form…
    </p>
  ),
});

const RecruiterOverviewPanel = dynamic(
  () => import("../../features/recruiter/RecruiterOverviewPanel"),
  {
    ssr: false,
    loading: () => (
      <p className="animate-pulse text-sm text-ui-text/70" role="status">
        Loading recruiter overview…
      </p>
    ),
  },
);

const ResumePanel = dynamic(() => import("../../features/resume/ResumePanel"), {
  ssr: false,
  loading: () => (
    <p className="animate-pulse text-sm text-ui-text/70" role="status">
      Loading resume…
    </p>
  ),
});

const modalTitles: Record<Exclude<ModalId, "none">, string> = {
  recruiter: "Recruiter Mode",
  contact: "Contact",
  resume: "Resume",
  projectDetail: "Project",
  cottageDesk: "Cottage — Desk",
  cottageBookshelf: "Cottage — Bookshelf",
  cottageWindow: "Cottage — Window",
};

export function ModalLayer() {
  const activeModal = useGardenStore(selectActiveModal);
  const activeProjectId = useGardenStore(selectActiveProjectId);
  const closeModal = useGardenStore((s) => s.closeModal);
  const openModal = useGardenStore((s) => s.openModal);

  const activeProject = useMemo(
    () => (activeProjectId ? getProjectById(activeProjectId) : undefined),
    [activeProjectId],
  );

  const open = activeModal !== "none";

  const onEscape = useCallback(() => {
    closeModal();
  }, [closeModal]);

  useEscapeKey(open, onEscape);

  const title =
    activeModal === "none"
      ? ""
      : activeModal === "projectDetail"
        ? `${modalTitles.projectDetail}${activeProject && activeModal === "projectDetail" ? `: ${activeProject.name}` : activeProjectId ? `: ${activeProjectId}` : ""}`
        : modalTitles[activeModal];

  const mobileFullBleed = activeModal === "recruiter" || activeModal === "resume";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={
            mobileFullBleed
              ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50 max-md:items-stretch max-md:justify-stretch max-md:p-0 md:p-4"
              : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="presentation"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <motion.article
            id={activeModal === "recruiter" ? "recruiter-panel" : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={
              mobileFullBleed
                ? "font-body flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded border-4 border-ui-text/30 bg-ui-bg p-6 text-ui-text shadow-xl max-md:m-0 max-md:max-h-none max-md:min-h-0 max-md:flex-1 max-md:rounded-none max-md:border-0 max-md:p-5 md:max-h-[90vh] " +
                  (activeModal === "recruiter" ? "md:max-w-2xl" : "")
                : "font-body max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border-4 border-ui-text/30 bg-ui-bg p-6 text-ui-text shadow-xl"
            }
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="modal-title" className="font-pixel text-[10px] leading-snug sm:text-xs">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => closeModal()}
                className="font-pixel shrink-0 rounded border-2 border-ui-text/30 px-2 py-1 text-[8px] text-ui-text hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label="Close dialog"
              >
                × Close
              </button>
            </div>
            {activeModal === "recruiter" && (
              <RecruiterOverviewPanel
                onRequestContact={() => {
                  closeModal();
                  queueMicrotask(() => openModal("contact"));
                }}
              />
            )}
            {activeModal === "contact" && <ContactForm onClose={() => closeModal()} />}
            {activeModal === "resume" && <ResumePanel />}
            {activeModal === "projectDetail" &&
              (activeProject ? (
                <ProjectDetailPanel project={activeProject} />
              ) : (
                <p className="text-sm text-ui-text/80">Unknown project id.</p>
              ))}
            {activeModal === "cottageDesk" && (
              <>
                <CottageSectionPanel section="desk" />
                <div className="mt-4 flex justify-end border-t border-ui-text/15 pt-3">
                  <button
                    type="button"
                    onClick={() => closeModal()}
                    className="font-pixel rounded border-2 border-ui-text/35 px-3 py-2 text-[8px] text-ui-text hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[9px]"
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
            {activeModal === "cottageBookshelf" && (
              <>
                <CottageSectionPanel section="bookshelf" />
                <div className="mt-4 flex justify-end border-t border-ui-text/15 pt-3">
                  <button
                    type="button"
                    onClick={() => closeModal()}
                    className="font-pixel rounded border-2 border-ui-text/35 px-3 py-2 text-[8px] text-ui-text hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[9px]"
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
            {activeModal === "cottageWindow" && (
              <>
                <CottageSectionPanel section="window" />
                <div className="mt-4 flex justify-end border-t border-ui-text/15 pt-3">
                  <button
                    type="button"
                    onClick={() => closeModal()}
                    className="font-pixel rounded border-2 border-ui-text/35 px-3 py-2 text-[8px] text-ui-text hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[9px]"
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
