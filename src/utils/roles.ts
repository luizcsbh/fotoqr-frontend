import { User } from '../types';

/** Super admins (and platform admins) see every event and the admin console. */
export const isSuperAdmin = (user?: Pick<User, 'role'> | null): boolean =>
  user?.role === 'super_admin' || user?.role === 'platform_admin';

export const ROLE_LABELS: Record<string, string> = {
  user: 'Usuário',
  dj: 'DJ',
  reader: 'Leitor (portaria)',
  super_admin: 'Super admin',
  platform_admin: 'Super admin',
};
