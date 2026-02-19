
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
    console.log('Backing up data from SQLite...');

    const data = {
        users: await prisma.user.findMany(),
        accounts: await prisma.account.findMany(),
        sessions: await prisma.session.findMany(),
        measurementTypes: await prisma.measurementType.findMany(),
        measurements: await prisma.measurement.findMany(),
        measurementValues: await prisma.measurementValue.findMany(),
        photos: await prisma.photo.findMany(),
    };

    const backupPath = path.join(process.cwd(), 'backup_data.json');
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    console.log(`Backup saved to ${backupPath}`);
    console.log(`Counts:
    Users: ${data.users.length}
    Photos: ${data.photos.length}
    Measurements: ${data.measurements.length}
  `);
}

backup()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
