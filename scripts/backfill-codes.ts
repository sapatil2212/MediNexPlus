import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Fetch hospitals via raw query
  const hospitals: Array<{ id: string; name: string }> =
    await prisma.$queryRaw`SELECT id, name FROM Hospital`;

  for (const hospital of hospitals) {
    const hospitalId = hospital.id;

    // Doctors without doctorCode
    const doctors: Array<{ id: string }> = await prisma.$queryRaw`
      SELECT id FROM Doctor
      WHERE hospitalId = ${hospitalId} AND (doctorCode IS NULL OR doctorCode = '')
      ORDER BY createdAt ASC
    `;

    const existingDocRows: Array<{ cnt: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(*) as cnt FROM Doctor
      WHERE hospitalId = ${hospitalId} AND doctorCode IS NOT NULL AND doctorCode != ''
    `;
    let existingDocCount = Number(existingDocRows[0]?.cnt ?? 0);

    for (const doc of doctors) {
      existingDocCount++;
      const code = `DOC-${String(existingDocCount).padStart(4, "0")}`;
      await prisma.$executeRaw`UPDATE Doctor SET doctorCode = ${code} WHERE id = ${doc.id}`;
    }

    // Users without userCode
    const users: Array<{ id: string }> = await prisma.$queryRaw`
      SELECT id FROM User
      WHERE hospitalId = ${hospitalId} AND (userCode IS NULL OR userCode = '')
      ORDER BY createdAt ASC
    `;

    const existingUserRows: Array<{ cnt: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(*) as cnt FROM User
      WHERE hospitalId = ${hospitalId} AND userCode IS NOT NULL AND userCode != ''
    `;
    let existingUserCount = Number(existingUserRows[0]?.cnt ?? 0);

    for (const u of users) {
      existingUserCount++;
      const code = `USR-${String(existingUserCount).padStart(4, "0")}`;
      await prisma.$executeRaw`UPDATE User SET userCode = ${code} WHERE id = ${u.id}`;
    }

    console.log(`[${hospital.name}] Doctors: +${doctors.length}  Users: +${users.length}`);
  }
  console.log("Backfill complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
