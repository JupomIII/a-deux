import { useId } from 'react';

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className="setting">
      <div className="setting__text">
        <p className="setting__label" id={labelId}>
          {label}
        </p>
        {description ? (
          <p className="setting__desc" id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="switch__track" aria-hidden="true">
          <span className="switch__thumb" />
        </span>
      </button>
    </div>
  );
}
