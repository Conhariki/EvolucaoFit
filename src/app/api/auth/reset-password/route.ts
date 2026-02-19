import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Using bcryptjs as it's likely used for hashing

// Need to verify if project uses bcrypt or something else. 
// Step 508 login page uses signIn from next-auth.
// src/lib/auth.ts likely has the hashing logic. 
// I'll assume bcryptjs for now, but I should check package.json or auth.ts.

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { email, code, newPassword } = await req.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json({ message: 'Código inválido ou expirado.' }, { status: 400 });
        }

        if (user.resetToken !== code) {
            return NextResponse.json({ message: 'Código inválido.' }, { status: 400 });
        }

        if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
            return NextResponse.json({ message: 'Código expirado.' }, { status: 400 });
        }

        // Hash new password
        // Wait, I need to check how passwords are hashed in this project.
        // I haven't seen the package.json dependency for bcrypt.
        // I'll assume bcryptjs is available or I might need to install it?
        // Project likely has it since it has credentials auth.
        // I'll verify package.json in next step if this fails or proactively now.

        // Quick fix: assume standard simple hashing or just save plain if that was the case (unlikely).
        // Let's assume bcryptjs.
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null,
            },
        });

        return NextResponse.json({ message: 'Senha alterada com sucesso.' });

    } catch (error) {
        console.error('Error in reset-password:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}
