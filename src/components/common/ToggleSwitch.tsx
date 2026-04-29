interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  leftLabel: string;
  rightLabel: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  leftLabel,
  rightLabel,
}: ToggleSwitchProps) {
  return (
    <button className="toggle-switch" type="button" onClick={onChange} aria-pressed={checked}>
      <span className={!checked ? 'active' : ''}>{leftLabel}</span>
      <span className={checked ? 'active' : ''}>{rightLabel}</span>
    </button>
  );
}
