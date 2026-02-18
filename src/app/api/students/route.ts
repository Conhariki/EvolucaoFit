import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { alunos: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Se for professor, retorna seus alunos
    if (user.role === 'PROFESSOR') {
      return NextResponse.json(user.alunos);
    }

    // Se for aluno, retorna apenas ele mesmo
    return NextResponse.json([user]);
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alunos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json(
        { error: 'Apenas professores podem vincular alunos' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { studentId } = data;

    if (!studentId) {
      return NextResponse.json(
        { error: 'ID do aluno é obrigatório' },
        { status: 400 }
      );
    }

    const student = await prisma.user.update({
      where: { id: studentId },
      data: {
        professorId: session.user.id,
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Erro ao vincular aluno:', error);
    return NextResponse.json(
      { error: 'Erro ao vincular aluno' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json(
        { error: 'Apenas professores podem desvincular alunos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'ID do aluno é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: studentId },
      data: {
        professorId: null,
      },
    });

    return NextResponse.json({ message: 'Aluno desvinculado com sucesso' });
  } catch (error) {
    console.error('Erro ao desvincular aluno:', error);
    return NextResponse.json(
      { error: 'Erro ao desvincular aluno' },
      { status: 500 }
    );
  }
}

