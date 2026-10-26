import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Camera, KeyRound, Mail, Save, Upload, UserRound } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error;
    if (typeof message === 'string') return message;
  }
  return 'Não foi possível salvar as alterações. Tente novamente.';
}

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatar_url]);

  useEffect(() => {
    if (!selectedAvatar) {
      setAvatarPreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatar]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setIsSavingProfile(true);
    try {
      await authService.updateProfile(name);
      await refreshUser();
      setProfileMessage('Perfil atualizado com sucesso.');
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProfileError('');
    setProfileMessage('');
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      setSelectedAvatar(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileError('Escolha uma imagem JPG, PNG ou WEBP.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('A imagem deve ter no máximo 5MB.');
      event.target.value = '';
      return;
    }
    setSelectedAvatar(file);
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatar) {
      setProfileError('Escolha uma imagem antes de enviar.');
      return;
    }
    setProfileError('');
    setProfileMessage('');
    setIsUploadingAvatar(true);
    try {
      await authService.updateAvatar(selectedAvatar);
      setSelectedAvatar(null);
      await refreshUser();
      setProfileMessage('Foto do perfil atualizada com sucesso.');
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== passwordConfirmation) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }
    setIsSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      setPasswordMessage('Senha alterada com sucesso.');
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const displayedAvatar = avatarPreview || (!avatarLoadError ? user?.avatar_url : '');
  const hasUnavailableAvatar = Boolean(user?.avatar_url && avatarLoadError && !avatarPreview);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Meu perfil</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie seus dados, sua foto e sua senha.</p>
        </header>

        <div className="space-y-6">
          <Card padding="lg">
            <div className="mb-6 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">Dados do perfil</h2>
            </div>

            <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {displayedAvatar ? (
                <img
                  src={displayedAvatar}
                  alt={`Foto de perfil de ${user?.name || 'usuário'}`}
                  className="h-20 w-20 rounded-full border-2 border-slate-200 object-cover"
                  onError={() => {
                    if (!avatarPreview) setAvatarLoadError(true);
                  }}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Camera className="h-8 w-8" />
                </div>
              )}
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  {hasUnavailableAvatar ? 'Recuperar foto' : 'Escolher foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="sr-only"
                    aria-label="Escolher foto do perfil"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  {hasUnavailableAvatar
                    ? 'A foto atual não está disponível. Selecione novamente uma imagem do seu dispositivo.'
                    : 'JPG, PNG ou WEBP; máximo de 5MB.'}
                </p>
                {selectedAvatar && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAvatarUpload}
                    isLoading={isUploadingAvatar}
                    className="mt-3"
                  >
                    Enviar foto
                  </Button>
                )}
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nome
                </label>
                <input
                  id="profile-name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={255}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="profile-email"
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-500"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">O e-mail da conta não pode ser alterado.</p>
              </div>
              <Button type="submit" isLoading={isSavingProfile} leftIcon={<Save className="h-4 w-4" />}>
                Salvar perfil
              </Button>
            </form>
          </Card>

          <Card padding="lg">
            <div className="mb-6 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">Trocar senha</h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Senha atual
                </label>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  maxLength={72}
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nova senha
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label htmlFor="password-confirmation" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Confirmar nova senha
                </label>
                <input
                  id="password-confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <Button type="submit" isLoading={isSavingPassword} leftIcon={<KeyRound className="h-4 w-4" />}>
                Atualizar senha
              </Button>
            </form>
            {passwordError && <p className="mt-4 text-sm text-red-700" role="alert">{passwordError}</p>}
            {passwordMessage && <p className="mt-4 text-sm text-emerald-700" role="status">{passwordMessage}</p>}
          </Card>

          {(profileError || profileMessage) && (
            <p
              className={`text-sm ${profileError ? 'text-red-700' : 'text-emerald-700'}`}
              role={profileError ? 'alert' : 'status'}
            >
              {profileError || profileMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
