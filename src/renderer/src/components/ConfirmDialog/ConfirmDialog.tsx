import { Modal, TitleBar } from '@react95/core';
import { MouseEvent } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: ConfirmDialogProps): JSX.Element {
  function handleBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
      <Modal
        className="confirm-dialog"
        title={title}
        hasWindowButton={false}
        titleBarOptions={[<TitleBar.Close key="close" onClick={onCancel} />]}
        buttons={[
          { value: cancelLabel, onClick: onCancel },
          { value: confirmLabel, onClick: onConfirm }
        ]}
      >
        <Modal.Content>
          <p className="confirm-dialog__message">{message}</p>
        </Modal.Content>
      </Modal>
    </div>
  );
}
