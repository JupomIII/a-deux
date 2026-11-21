import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="dialog__panel">
        <h2 className="dialog__title" id={titleId}>
          {title}
        </h2>
        {description ? (
          <p className="dialog__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {children}
        {footer ? <div className="dialog__actions">{footer}</div> : null}
      </div>
    </dialog>
  );
}
