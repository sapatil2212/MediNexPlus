import { findAllHospitals, findHospitalById, updateHospital } from "../repositories/hospital.repo";
import prisma from "../config/db";

export const getHospitalDetailsService = async (id: string) => {
  return await findHospitalById(id);
};

export const listHospitalsService = async () => {
  return await findAllHospitals();
};

export const updateHospitalService = async (id: string, data: any) => {
  return await updateHospital(id, data);
};

export const getSuperAdminDashboardStats = async () => {
  const hospitals = await (prisma as any).hospital.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          patients: true,
          doctors: true,
          staffMembers: true,
          appointments: true,
          departments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalPatients = hospitals.reduce((sum: number, h: any) => sum + h._count.patients, 0);
  const totalDoctors = hospitals.reduce((sum: number, h: any) => sum + h._count.doctors, 0);
  const totalStaff = hospitals.reduce((sum: number, h: any) => sum + h._count.staffMembers, 0);
  const totalAppointments = hospitals.reduce((sum: number, h: any) => sum + h._count.appointments, 0);
  const verifiedCount = hospitals.filter((h: any) => h.isVerified).length;
  const pendingCount = hospitals.filter((h: any) => !h.isVerified).length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const monthlyGrowth = [];
  for (let i = 8; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - i, 1);
    const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);
    const count = hospitals.filter((h: any) => {
      const createdDate = new Date(h.createdAt);
      return createdDate >= targetDate && createdDate < nextMonth;
    }).length;
    
    monthlyGrowth.push({
      month: targetDate.toLocaleDateString('en-US', { month: 'short' }),
      value: count,
    });
  }

  const recentActivity = await (prisma as any).notification.findMany({
    where: {
      userId: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      createdAt: true,
    },
  });

  const formattedActivity = recentActivity.map((activity: any) => {
    const now = new Date();
    const createdAt = new Date(activity.createdAt);
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo = '';
    if (diffMins < 1) timeAgo = 'Just now';
    else if (diffMins < 60) timeAgo = `${diffMins} min ago`;
    else if (diffHours < 24) timeAgo = `${diffHours} hr ago`;
    else timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    let activityType = 'info';
    if (activity.type.includes('ERROR') || activity.type.includes('FAILED')) activityType = 'danger';
    else if (activity.type.includes('WARNING')) activityType = 'warn';
    else if (activity.type.includes('SUCCESS') || activity.type.includes('COMPLETED')) activityType = 'success';

    return {
      time: timeAgo,
      msg: activity.message || activity.title,
      type: activityType,
    };
  });

  const hospitalsWithStats = hospitals.map((h: any) => ({
    id: h.id,
    name: h.name,
    email: h.email,
    mobile: h.mobile,
    isVerified: h.isVerified,
    createdAt: h.createdAt,
    patients: h._count.patients,
    doctors: h._count.doctors,
    staff: h._count.staffMembers,
    appointments: h._count.appointments,
    departments: h._count.departments,
  }));

  return {
    hospitals: hospitalsWithStats,
    stats: {
      totalHospitals: hospitals.length,
      verifiedHospitals: verifiedCount,
      pendingHospitals: pendingCount,
      totalPatients,
      totalDoctors,
      totalStaff,
      totalAppointments,
    },
    monthlyGrowth,
    recentActivity: formattedActivity,
  };
};
