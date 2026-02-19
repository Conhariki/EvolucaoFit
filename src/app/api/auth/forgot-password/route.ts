import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Configure Nodemailer (replace with actual credentials from env or user input later)
// For now we will log the code to console if no env vars are set, 
// or use a test account if possible.
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use host/port
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email é obrigatório.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // For security, don't reveal if user exists or not, but for this app maybe it's fine.
            // Let's pretend we sent it.
            return NextResponse.json({ message: 'Se o email existir, um código foi enviado.' });
        }

        // Generate token (6 digit code)
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpires,
            },
        });

        console.log(`[RESET PASSWORD] Code for ${email}: ${resetToken}`);

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Recuperação de Senha - EvoluçãoFit',
                text: `Seu código de recuperação de senha é: ${resetToken}`,
                html: `<p>Seu código de recuperação de senha é: <b>${resetToken}</b></p>`,
            });
        } else {
            console.log('EMAIL_USER or EMAIL_PASS not set. Check console for code.');
        }

        return NextResponse.json({ message: 'Se o email existir, um código foi enviado.' });

    } catch (error) {
        console.error('Error in forgot-password:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}
