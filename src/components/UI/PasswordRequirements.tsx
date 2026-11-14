import React from 'react';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { getPasswordRules } from '../../utils/passwordRules';

interface PasswordRequirementsProps {
  password: string;
  confirmation: string;
  id?: string;
  className?: string;
}

/**
 * Live checklist shown right below the new-password field: each rule turns
 * green when it is met. The "passwords match" rule is shown under the
 * confirmation field by PasswordMatchHint.
 */
export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  confirmation,
  id,
  className = '',
}) => {
  const rules = getPasswordRules(password, confirmation).filter((rule) => rule.id !== 'match');

  return (
    <div id={id} className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ${className}`}>
      <p className="mb-2 text-xs font-semibold text-slate-700">A senha deve ter:</p>
      <ul className="space-y-1.5" aria-live="polite">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-2 text-xs ${rule.met ? 'font-semibold text-emerald-700' : 'text-slate-500'}`}
          >
            {rule.met ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{rule.met ? ' (atendido)' : ' (pendente)'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface PasswordMatchHintProps {
  password: string;
  confirmation: string;
}

/** Shown below the confirmation field: tells whether both passwords are equal. */
export const PasswordMatchHint: React.FC<PasswordMatchHintProps> = ({ password, confirmation }) => {
  const matches = password.length > 0 && password === confirmation;
  const mismatch = confirmation.length > 0 && !matches;

  return (
    <p
      aria-live="polite"
      className={`mt-2 flex items-center gap-2 text-xs ${
        matches ? 'font-semibold text-emerald-700' : mismatch ? 'font-semibold text-red-600' : 'text-slate-500'
      }`}
    >
      {matches ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      ) : mismatch ? (
        <XCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
      )}
      <span>{matches ? 'As duas senhas são iguais' : mismatch ? 'As senhas não são iguais' : 'As duas senhas devem ser iguais'}</span>
    </p>
  );
};
