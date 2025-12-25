'use client';

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export function TimePicker({ value, onChange, className, id }: TimePickerProps) {
  const [hours, setHours] = React.useState("10");
  const [minutes, setMinutes] = React.useState("00");

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHours(h || "10");
      setMinutes(m || "00");
    }
  }, [value]);

  const handleHoursChange = (newHours: string) => {
    setHours(newHours);
    onChange(`${newHours}:${minutes}`);
  };

  const handleMinutesChange = (newMinutes: string) => {
    setMinutes(newMinutes);
    onChange(`${hours}:${newMinutes}`);
  };

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return hour;
  });

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = ['00', '15', '30', '45'];

  return (
    <div className={cn("flex items-center gap-2", className)} id={id}>
      <Select value={hours} onValueChange={handleHoursChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={minutes} onValueChange={handleMinutesChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((minute) => (
            <SelectItem key={minute} value={minute}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
