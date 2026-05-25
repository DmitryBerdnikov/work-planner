import type { UseFormRegisterReturn } from "react-hook-form";

type FormInputProps = {
  label: string;
  required?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
};

export const FormInput = ({ label, required, error, registration }: FormInputProps) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        className="min-h-12 w-full rounded-input border border-border bg-surface-muted px-4 outline-none focus:border-primary"
        required={required}
        {...registration}
      />
      {error && <span className="mt-2 block text-sm font-bold text-danger">{error}</span>}
    </label>
  );
};
