// types/form.ts
export type FieldType = "text" | "textarea" | "number" | "select" | "date" | "checkbox";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[]; // for select fields
}

export interface FormSchema {
  title?: string;
  fields: Field[];
  submitLabel?: string;
}
