import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const { theme } = await req.json();

        if (theme !== 'light' && theme !== 'dark') {
            return NextResponse.json({ message: 'Tema inválido' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { theme },
        });

        return NextResponse.json({ message: 'Tema atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar tema:', error);
        return NextResponse.json(
            { message: 'Erro interno ao atualizar o tema' },
            { status: 500 }
        );
    }
}
