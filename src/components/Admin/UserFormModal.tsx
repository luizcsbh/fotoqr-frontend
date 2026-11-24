import React, { FormEvent, useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { PasswordInput } from '../UI/PasswordInput';
import { PasswordMatchHint, PasswordRequirements } from '../UI/PasswordRequirements';
import { isPasswordValid } from '../../utils/passwordRules';
import { ROLE_LABELS } from '../../utils/roles';
import { ManagedUser, ManagedUserRole } from '../../types';

export const ASSIGNABLE_ROLES: ManagedUserRole[] = ['user', 'dj', 'reader', 'super_admin'];

export interface UserFormValues {
  name: string;
  email: string;
  /** Empty when editing without changing the password */
  password: string;
  role: ManagedUserRole;
}

interface UserFormModalProps {
  isOpen: boolean;
  /** Account being edited; undefined to create a new one */
  user?: ManagedUser;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}

const inputClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';

/** Create an account, or edit an account's name, e-mail and password (super admin). */
export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, user, isSaving, onClose, onSubmit }) => {
  const isEdit = Boolean(user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ManagedUserRole>('user');
  const [changePassword, setChangePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Fresh form every time it opens
  useEffect(() => {
    if (!isOpen) return;
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setRole((user?.role as ManagedUserRole) ?? 'user');
    setChangePassword(!user);
    setPassword('');
    setConfirmation('');
  }, [isOpen, user]);

  const wantsPassword = !isEdit || changePassword;
  const passwordOk = !wantsPassword || isPasswordValid(password, confirmation);
  const detailsOk = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const hasChanges =
    !isEdit ||
    name.trim() !== user?.name ||
    email.trim().toLowerCase() !== user?.email.toLowerCase() ||
    (changePassword && password.length > 0);
  const canSubmit = detailsOk && passwordOk && hasChanges && !isSaving;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), email: email.trim(), password: wantsPassword ? password : '', role });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSaving && onClose()}
      title={isEdit ? 'Editar usuário' : 'Novo usuário'}
      description={
        isEdit
          ? 'Altere os dados de acesso. Ao trocar o e-mail ou a senha, a pessoa precisará entrar de novo.'
          : 'A conta já poderá entrar com o e-mail e a senha definidos aqui. Combine a senha com a pessoa.'
      }
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" size="sm" isLoading={isSaving} disabled={!canSubmit}>
            {isEdit ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="user-form-name" className={labelClass}>
            Nome
          </label>
          <input
            id="user-form-name"
            type="text"
            autoComplete="off"
            maxLength={255}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="user-form-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="user-form-email"
            type="email"
            autoComplete="off"
            maxLength={255}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        {!isEdit && (
          <div>
            <label htmlFor="user-form-role" className={labelClass}>
              Perfil
            </label>
            <select
              id="user-form-role"
              value={role}
              onChange={(e) => setRole(e.target.value as ManagedUserRole)}
              className={inputClass}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        )}

        {isEdit && !changePassword && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-600">
              {user?.hasPassword
                ? 'A senha atual continua valendo.'
                : 'Esta conta não tem senha: entra só pelo link exclusivo de DJ ou portaria.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setChangePassword(true)}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              {user?.hasPassword ? 'Definir nova senha' : 'Criar senha'}
            </Button>
          </div>
        )}

        {wantsPassword && (
          <>
            <div>
              <label htmlFor="user-form-password" className={labelClass}>
                {isEdit ? 'Nova senha' : 'Senha'}
              </label>
              <PasswordInput
                id="user-form-password"
                autoComplete="new-password"
                maxLength={72}
                required
                aria-describedby="user-form-password-rules"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordRequirements
                id="user-form-password-rules"
                className="mt-2"
                password={password}
                confirmation={confirmation}
              />
            </div>
            <div>
              <label htmlFor="user-form-password-confirmation" className={labelClass}>
                Confirmar senha
              </label>
              <PasswordInput
                id="user-form-password-confirmation"
                autoComplete="new-password"
                maxLength={72}
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
              <PasswordMatchHint password={password} confirmation={confirmation} />
            </div>
            {isEdit && (
              <button
                type="button"
                onClick={() => {
                  setChangePassword(false);
                  setPassword('');
                  setConfirmation('');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Manter a senha atual
              </button>
            )}
          </>
        )}
      </form>
    </Modal>
  );
};
