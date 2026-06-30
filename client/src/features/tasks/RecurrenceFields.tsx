import { useId } from "react";
import type { TaskDto } from "@priority1/shared";

export type RecurrenceType = NonNullable<TaskDto["recurrenceType"]>;

export type RecurrenceFormValue = {
  recurrenceType: RecurrenceType | null;
  recurrenceDays: number[];
};

type Props = {
  value: RecurrenceFormValue;
  onChange: (value: RecurrenceFormValue) => void;
};

const recurrenceOptions: Array<{ value: RecurrenceType; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every two weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom days" }
];

const dayOptions = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" }
];

export const RecurrenceFields = ({ value, onChange }: Props) => {
  const groupName = useId();
  const recurring = Boolean(value.recurrenceType);

  const setRecurring = (enabled: boolean) => {
    onChange({
      recurrenceType: enabled ? value.recurrenceType ?? "daily" : null,
      recurrenceDays: enabled ? value.recurrenceDays : []
    });
  };

  const toggleDay = (day: number) => {
    const selected = value.recurrenceDays.includes(day);
    onChange({
      ...value,
      recurrenceDays: selected
        ? value.recurrenceDays.filter((current) => current !== day)
        : [...value.recurrenceDays, day].sort((a, b) => a - b)
    });
  };

  return (
    <fieldset className="recurrence-fields">
      <label className="checkbox-label">
        <input
          checked={recurring}
          onChange={(event) => setRecurring(event.target.checked)}
          type="checkbox"
        />
        <span>Recurring task</span>
      </label>

      {recurring && (
        <div className="recurrence-options">
          <div className="recurrence-choice-grid">
            {recurrenceOptions.map((option) => (
              <label key={option.value} className="radio-card">
                <input
                  checked={value.recurrenceType === option.value}
                  name={groupName}
                  onChange={() =>
                    onChange({
                      recurrenceType: option.value,
                      recurrenceDays: option.value === "custom" ? value.recurrenceDays : []
                    })
                  }
                  type="radio"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          {value.recurrenceType === "custom" && (
            <div className="weekday-picker" aria-label="Custom recurrence days">
              {dayOptions.map((day) => (
                <button
                  key={day.value}
                  className="weekday-button"
                  type="button"
                  aria-pressed={value.recurrenceDays.includes(day.value)}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </fieldset>
  );
};
