"use client";


import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Icon } from "./Icon";


/**
* 13.2 — modals trap focus, close on Escape, and return focus to the trigger.
*/
export function Modal({
 open,
 onClose,
 title,
 children,
 footer,
 width = 480,
 labelledBy = "tt-modal-title",
}: {
 open: boolean;
 onClose: () => void;
 title: string;
 children: ReactNode;
 footer?: ReactNode;
 width?: number;
 labelledBy?: string;
}) {
 const panelRef = useRef<HTMLDivElement>(null);
 const previouslyFocused = useRef<HTMLElement | null>(null);


 /**
  * Callers pass `onClose` as a fresh closure on every render (`onClose={close}`
  * where `close` is declared in the component body). Depending on its identity
  * would tear down and re-run the effect below on every keystroke in a field
  * inside the modal, which re-ran the "move focus into the dialog" step and
  * stole focus to the close button mid-typing. Holding it in a ref keeps the
  * effect tied to `open` alone.
  */
 const onCloseRef = useRef(onClose);
 useEffect(() => {
   onCloseRef.current = onClose;
 });
 // Portalling needs the DOM, so wait until after hydration.
 const [mounted, setMounted] = useState(false);


 useEffect(() => setMounted(true), []);


 useEffect(() => {
   if (!open) return;


   previouslyFocused.current = document.activeElement as HTMLElement | null;
   const { overflow } = document.body.style;
   document.body.style.overflow = "hidden";


   const focusables = () =>
     Array.from(
       panelRef.current?.querySelectorAll<HTMLElement>(
         'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
       ) ?? [],
     ).filter((el) => el.offsetParent !== null || el === document.activeElement);


   // Move focus into the dialog on open.
   window.setTimeout(() => {
     const items = focusables();
     (items[0] ?? panelRef.current)?.focus();
   }, 0);


   function onKeyDown(event: KeyboardEvent) {
     if (event.key === "Escape") {
       event.stopPropagation();
       onCloseRef.current();
       return;
     }
     if (event.key !== "Tab") return;


     const items = focusables();
     if (items.length === 0) return;
     const first = items[0];
     const last = items[items.length - 1];


     if (event.shiftKey && document.activeElement === first) {
       event.preventDefault();
       last.focus();
     } else if (!event.shiftKey && document.activeElement === last) {
       event.preventDefault();
       first.focus();
     }
   }


   document.addEventListener("keydown", onKeyDown, true);
   return () => {
     document.removeEventListener("keydown", onKeyDown, true);
     document.body.style.overflow = overflow;
     previouslyFocused.current?.focus?.();
   };
 }, [open]);


 if (!open || !mounted) return null;


 /**
  * Rendered into document.body rather than in place. Several of the surfaces
  * that open a modal sit inside a `position: sticky` container, and sticky
  * creates a stacking context: a modal rendered inside one is trapped beneath
  * any later page content, however high its own z-index. A portal puts the
  * overlay at the top level where it belongs.
  */
 return createPortal(
   <div
     style={{
       position: "fixed",
       inset: 0,
       zIndex: 80,
       background: "rgba(16, 24, 40, 0.45)",
       display: "flex",
       alignItems: "center",
       justifyContent: "center",
       padding: 16,
       overflowY: "auto",
     }}
     onMouseDown={(event) => {
       if (event.target === event.currentTarget) onClose();
     }}
   >
     <div
       ref={panelRef}
       role="dialog"
       aria-modal="true"
       aria-labelledby={labelledBy}
       tabIndex={-1}
       style={{
         background: "var(--surface)",
         borderRadius: "var(--radius-lg)",
         boxShadow: "var(--shadow-xl)",
         width: "100%",
         maxWidth: width,
         maxHeight: "calc(100vh - 32px)",
         display: "flex",
         flexDirection: "column",
         outline: "none",
       }}
     >
       <div
         style={{
           display: "flex",
           alignItems: "center",
           justifyContent: "space-between",
           gap: 12,
           padding: "var(--space-5)",
           borderBottom: "1px solid var(--border)",
         }}
       >
         <h2 id={labelledBy} className="t-h3" style={{ margin: 0 }}>
           {title}
         </h2>
         <button
           type="button"
           onClick={onClose}
           aria-label="Close"
           style={{
             background: "transparent",
             border: 0,
             cursor: "pointer",
             color: "var(--ink-muted)",
             display: "flex",
             padding: 6,
             borderRadius: "var(--radius-md)",
           }}
         >
           <Icon name="x" size={20} />
         </button>
       </div>


       <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1 }}>{children}</div>


       {footer ? (
         <div
           style={{
             padding: "var(--space-5)",
             borderTop: "1px solid var(--border)",
             display: "flex",
             justifyContent: "flex-end",
             gap: "var(--space-3)",
             flexWrap: "wrap",
           }}
         >
           {footer}
         </div>
       ) : null}
     </div>
   </div>,
   document.body,
 );
}



