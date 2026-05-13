import prisma from "../config/db";

export const createNotification = async (data: {
  hospitalId: string;
  userId?: string | null;
  targetRole?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: string | null;
}) => {
  return (prisma as any).notification.create({ data });
};

export const getNotifications = async (
  hospitalId: string,
  opts: { userId?: string; role?: string; limit?: number; offset?: number; types?: string[] }
) => {
  const where: any = {
    hospitalId,
    OR: [
      { userId: opts.userId || null },
      { targetRole: opts.role || null },
      { userId: null, targetRole: null },
    ],
    ...(opts.types && opts.types.length > 0 ? { type: { in: opts.types } } : {}),
  };
  const [data, total, unread] = await Promise.all([
    (prisma as any).notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: opts.limit ?? 20,
      skip: opts.offset ?? 0,
    }),
    (prisma as any).notification.count({ where }),
    (prisma as any).notification.count({ where: { ...where, isRead: false } }),
  ]);
  return { data, total, unread };
};

export const getUnreadCount = async (
  hospitalId: string,
  opts: { userId?: string; role?: string; types?: string[] }
) => {
  const where: any = {
    hospitalId,
    isRead: false,
    OR: [
      { userId: opts.userId || null },
      { targetRole: opts.role || null },
      { userId: null, targetRole: null },
    ],
    ...(opts.types && opts.types.length > 0 ? { type: { in: opts.types } } : {}),
  };
  return (prisma as any).notification.count({ where });
};

export const markAllRead = async (
  hospitalId: string,
  opts: { userId?: string; role?: string }
) => {
  const where: any = {
    hospitalId,
    isRead: false,
    OR: [
      { userId: opts.userId || null },
      { targetRole: opts.role || null },
      { userId: null, targetRole: null },
    ],
  };
  return (prisma as any).notification.updateMany({ where, data: { isRead: true } });
};

export const markOneRead = async (id: string) => {
  return (prisma as any).notification.update({ where: { id }, data: { isRead: true } });
};

export const deleteOldNotifications = async (hospitalId: string, daysOld = 30) => {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return (prisma as any).notification.deleteMany({
    where: { hospitalId, createdAt: { lt: cutoff } },
  });
};
