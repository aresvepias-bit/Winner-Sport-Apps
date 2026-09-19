"use client";

import React, { useState, useEffect } from "react";
import { formatThousand } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number | string;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
  prefix?: string;
  suffix?: string;
}

export default function NumberInput({
  value,
  onChange,
  allowDecimals = false,
  prefix,
  suffix,
  className = "",
  placeholder = "0",
  ...rest
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === "" || value === null || value === undefined) return "";
    return formatThousand(value, allowDecimals);
  });

  useEffect(() => {
    const formatted =
      value === "" || value === null || value === undefined
        ? ""
        : formatThousand(value, allowDecimals);

    const currentNum = allowDecimals
      ? parseFloat(displayValue.replace(/\./g, "").replace(",", ".")) || 0
      : parseInt(displayValue.replace(/\D/g, ""), 10) || 0;
    const propNum = typeof value === "number" ? value : parseFloat(String(value)) || 0;

    if (currentNum !== propNum || (displayValue === "" && formatted !== "")) {
      setDisplayValue(formatted);
    }
  }, [value, allowDecimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    if (inputVal === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    if (!allowDecimals) {
      const digits = inputVal.replace(/\D/g, "");
      if (!digits) {
        setDisplayValue("");
        onChange(0);
        return;
      }
      const num = parseInt(digits, 10);
      const formatted = new Intl.NumberFormat("id-ID").format(num);
      setDisplayValue(formatted);
      onChange(num);
    } else {
      const normalized = inputVal.replace(".", ",");
      const endsWithComma = normalized.endsWith(",");
      const parts = normalized.split(",");
      const intDigits = parts[0].replace(/\D/g, "");
      const intFormatted = intDigits
        ? new Intl.NumberFormat("id-ID").format(parseInt(intDigits, 10))
        : "0";

      if (parts.length > 1) {
        const decDigits = parts[1].replace(/\D/g, "").slice(0, 2);
        const display = `${intFormatted},${decDigits}`;
        const num = parseFloat(`${intDigits || "0"}.${decDigits || "0"}`);
        setDisplayValue(display);
        onChange(num);
      } else if (endsWithComma) {
        setDisplayValue(`${intFormatted},`);
        onChange(parseFloat(intDigits || "0"));
      } else {
        setDisplayValue(intFormatted);
        onChange(parseFloat(intDigits || "0"));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (displayValue.endsWith(",")) {
      const clean = displayValue.slice(0, -1);
      setDisplayValue(clean);
    }
    rest.onBlur?.(e);
  };

  const inputElement = (
    <input
      type="text"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );

  if (prefix || suffix) {
    return (
      <div className="relative flex items-center w-full">
        {prefix && (
          <span className="absolute left-3 text-slate-400 font-bold text-xs pointer-events-none">
            {prefix}
          </span>
        )}
        {inputElement}
        {suffix && (
          <span className="absolute right-3 text-slate-400 font-semibold text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return inputElement;
}
