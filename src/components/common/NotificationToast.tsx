import { useMemo } from 'react';
import { useUI } from '../../hooks/useUI';

export function NotificationToast() {
  const { notifications } = useUI();
  const visible = useMemo(() => notifications.slice(0, 3), [notifications]);

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack" aria-live="polite">
      {visible.map((message, index) => (
        <div className="toast" key={`${message}-${index}`}>
          {message}
        </div>
      ))}
    </div>
  );
}
