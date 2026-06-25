import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  prefix?: string;
};

export function Input({ prefix = "/", className = "", ...props }: InputProps) {
  return (
    <label className={`search-input ${className}`.trim()}>
      <span>{prefix}</span>
      <input {...props} />
    </label>
  );
}
