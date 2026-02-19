
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary manually since we are in a script
// We need to read .env or just use the URL if we know it. 
// Best to rely on dotenv if possible, or just parse the .env file ourselves to be safe in this script environemnt.
// But cloudinary lib auto-reads CLOUDINARY_URL from env if present. 
// Let's verify if process.env.CLOUDINARY_URL is set.
require('dotenv').config();

const prisma = new PrismaClient();

async function restore() {
    console.log('Restoring data to Postgres & Cloudinary...');

    const backupPath = path.join(process.cwd(), 'backup_data.json');
    if (!fs.existsSync(backupPath)) {
        console.error('Backup file not found!');
        return;
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // PROCEED WITH CAUTION: This assumes empty DB or we handle conflicts.
    // For migration, we usually start fresh.

    // 1. Restore Users
    console.log(`Restoring ${data.users.length} users...`);
    for (const user of data.users) {
        // Avoid duplicates if re-running
        const exists = await prisma.user.findUnique({ where: { id: user.id } });
        if (!exists) {
            await prisma.user.create({ data: user });
        }
    }

    // 2. Restore Sessions, Accounts (Optional, but good for login persistence)
    // ... might skip to avoid complexity if tokens are invalid, but let's try.

    // 3. Restore Measurement Types
    console.log(`Restoring ${data.measurementTypes.length} measurement types...`);
    for (const type of data.measurementTypes) {
        const exists = await prisma.measurementType.findUnique({ where: { id: type.id } });
        if (!exists) {
            await prisma.measurementType.create({ data: type });
        }
    }

    // 4. Restore Measurements & Values
    console.log(`Restoring ${data.measurements.length} measurements...`);
    for (const measurement of data.measurements) {
        const exists = await prisma.measurement.findUnique({ where: { id: measurement.id } });
        if (!exists) {
            // We need to create measurement first, then values
            // Or use create with nested write if values are linked in backup?
            // The backup has flat arrays.
            await prisma.measurement.create({ data: measurement });
        }
    }

    console.log(`Restoring ${data.measurementValues.length} measurement values...`);
    for (const value of data.measurementValues) {
        const exists = await prisma.measurementValue.findUnique({ where: { id: value.id } });
        if (!exists) {
            await prisma.measurementValue.create({ data: value });
        }
    }

    // 5. Restore Photos (Upload to Cloudinary)
    console.log(`Restoring ${data.photos.length} photos...`);
    for (const photo of data.photos) {
        const exists = await prisma.photo.findUnique({ where: { id: photo.id } });

        let newUrl = photo.url;

        // If photo is local (starts with /uploads), upload to Cloudinary
        if (photo.url.startsWith('/uploads')) {
            const localPath = path.join(process.cwd(), 'public', photo.url);
            if (fs.existsSync(localPath)) {
                console.log(`Uploading ${photo.url} to Cloudinary...`);
                try {
                    const result = await cloudinary.uploader.upload(localPath, {
                        folder: 'evolucao-fit/photos',
                        public_id: `${photo.userId}-${new Date(photo.date).getTime()}`,
                        // Using timestamp from photo date to maintain order/logic
                        resource_type: 'image'
                    });
                    newUrl = result.secure_url;
                } catch (err) {
                    console.error(`Failed to upload ${photo.url}:`, err.message);
                    // Keep local URL or fail? 
                    // If we fail upload, we probably shouldn't insert the photo or insert with broken URL?
                    // Let's insert with original URL marked as broken? 
                    // Or just skip.
                    // Better to keep original URL so we know it failed? 
                    // No, if we deploy, local URL won't work.
                    continue;
                }
            } else {
                console.warn(`File not found locally: ${localPath}`);
                continue;
            }
        }

        if (!exists) {
            await prisma.photo.create({
                data: {
                    ...photo,
                    url: newUrl
                }
            });
        }
    }

    console.log('Restore completed successfully!');
}

restore()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
