import prisma from './prisma';

export const hasPermission = async (roleName: string | undefined, action: string): Promise<boolean> => {
  if (!roleName) return false;
  if (roleName === 'ADMIN') return true;
  
  const systemRole = await prisma.systemRole.findUnique({ where: { name: roleName } });
  if (!systemRole) return false;
  
  return systemRole.permissions.includes(action);
};
