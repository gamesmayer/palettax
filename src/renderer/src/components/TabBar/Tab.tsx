import { Button, Frame, Input } from '@react95/core';
import { KeyboardEvent, MouseEvent, useState } from 'react';

interface TabProps {
  label: string;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
  onRename: (newLabel: string) => void;
}

export function Tab({ label, active, onSelect, onClose, onRename }: TabProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  function startEditing(event: MouseEvent): void {
    event.stopPropagation();
    setDraft(label);
    setIsEditing(true);
  }

  function commit(): void {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed !== label) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      commit();
    } else if (event.key === 'Escape') {
      setDraft(label);
      setIsEditing(false);
    }
  }

  return (
    <Frame as="li" className={`tab ${active ? 'tab--active' : ''}`} onClick={onSelect}>
      {isEditing ? (
        <Input
          className="tab__name-input"
          value={draft}
          autoFocus
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="tab__name" onDoubleClick={startEditing}>
          {label}
        </span>
      )}
      <Button
        className="tab__close"
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label={`Close ${label}`}
      >
        ×
      </Button>
    </Frame>
  );
}
