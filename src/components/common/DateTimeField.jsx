import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";
import { Japanese } from "flatpickr/dist/l10n/ja.js";
import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

// Same value contract as <input type="datetime-local">: "YYYY-MM-DDTHH:mm" in, onChange({ target: { value } }) out.
const VALUE_FORMAT = "Y-m-d\\TH:i";
const DISPLAY_FORMAT = "d/m/Y H:i";
const LOCALES = { vi: Vietnamese, ja: Japanese };
const GAP = 4;

const toDate = (value) => (value ? flatpickr.parseDate(String(value).slice(0, 16), VALUE_FORMAT) : null);

// Fixed under (or above) the field, so the calendar stays inside an MUI Dialog's focus trap without being clipped.
function placeCalendar(self) {
  const cal = self.calendarContainer;
  const box = self._input.getBoundingClientRect();
  const height = cal.offsetHeight;
  const below = window.innerHeight - box.bottom >= height + GAP || box.top < height + GAP;
  cal.style.position = "fixed";
  cal.style.top = `${below ? box.bottom + GAP : box.top - height - GAP}px`;
  cal.style.left = `${Math.max(GAP, Math.min(box.left, window.innerWidth - cal.offsetWidth - GAP))}px`;
  cal.style.right = "auto";
}

/** MUI text field with a 24-hour date-time picker (dd/mm/yyyy HH:mm). */
export default function DateTimeField({ value, onChange, slotProps, ...rest }) {
  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const { i18n } = useTranslation();
  onChangeRef.current = onChange;

  useEffect(() => {
    const input = inputRef.current;
    const picker = flatpickr(input, {
      enableTime: true,
      time_24hr: true,
      allowInput: true,
      dateFormat: DISPLAY_FORMAT,
      defaultDate: toDate(value),
      locale: LOCALES[i18n.language] || "default",
      minuteIncrement: 5,
      appendTo: input.closest(".MuiDialog-paper") || document.body,
      position: (self) => placeCalendar(self),
      onReady: (_dates, _str, self) => self.calendarContainer.classList.add("mes-dt"),
      onChange: (dates, _str, self) => {
        const next = dates[0] ? self.formatDate(dates[0], VALUE_FORMAT) : "";
        onChangeRef.current?.({ target: { value: next } });
      },
    });
    pickerRef.current = picker;
    return () => picker.destroy();
    // the picker is created once per language; value changes are synced below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const current = picker.selectedDates[0] ? picker.formatDate(picker.selectedDates[0], VALUE_FORMAT) : "";
    const next = value ? String(value).slice(0, 16) : "";
    if (current !== next) picker.setDate(toDate(next), false);
  }, [value]);

  return (
    <TextField
      {...rest}
      inputRef={inputRef}
      placeholder="dd/mm/yyyy hh:mm"
      autoComplete="off"
      slotProps={{ ...slotProps, inputLabel: { shrink: true, ...slotProps?.inputLabel } }}
    />
  );
}
