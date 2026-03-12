// Shared mobile-friendly form primitives used by all add forms

interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
}
export function Label({ htmlFor, children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5"
    >
      {children}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#C9C3E6] transition ${props.className ?? ""}`}
    />
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export function TextArea(props: TextAreaProps) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 3}
      className={`w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#C9C3E6] transition resize-none ${props.className ?? ""}`}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}
export function Select({ children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-heading focus:outline-none focus:ring-2 focus:ring-[#C9C3E6] transition ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

interface FieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
}
export function Field({ id, label, children }: FieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

interface SubmitButtonProps {
  loading: boolean;
  label?: string;
  loadingLabel?: string;
}
export function SubmitButton({
  loading,
  label = "Save",
  loadingLabel = "Saving…",
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3.5 rounded-2xl bg-[#C9C3E6] text-[#3A3370] font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

interface ErrorMsgProps {
  message?: string;
}
export function ErrorMsg({ message }: ErrorMsgProps) {
  if (!message) return null;
  return <p className="text-xs text-red-600 font-medium">{message}</p>;
}
