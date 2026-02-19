
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
    console.log('Backing up data from SQLite...');

    try {
        await prisma.$connect();
        console.log('Connected to database.');
    } catch (e) {
        console.error('Connection failed:', e);
        return;
    }

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
