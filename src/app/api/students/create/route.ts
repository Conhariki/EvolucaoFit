import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'PROFESSOR') {
            return NextResponse.json(
                { message: 'Apenas professores podem criar alunos.' },
                { status: 403 }
            );
        }

        const { name, email, password, birthDate, height, phone, address, gender } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Nome, email e senha são obrigatórios.' },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'Este email já está em uso.' },
                { status: 400 }
            );
        }

        const hashedPassword = await hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'ALUNO',
                professorId: session.user.id, // Auto-link to the professor
                birthDate: birthDate ? new Date(birthDate) : null,
                height: height ? parseFloat(height) : null,
                phone: phone || null,
                address: address || null,
                gender: gender || 'MASCULINO',
            },
        });

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'Aluno criado com sucesso.', user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error) {
        console.error('Erro ao criar aluno:', error);
        return NextResponse.json(
            { message: 'Erro ao criar aluno.' },
            { status: 500 }
        );
    }
}
