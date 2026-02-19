import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const types = await prisma.measurementType.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(types);
  } catch (error) {
    console.error('Erro ao buscar tipos de medidas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tipos de medidas' },
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

    const data = await request.json();
    const { name, description } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const type = await prisma.measurementType.create({
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json(type);
  } catch (error) {
    console.error('Erro ao criar tipo de medida:', error);
    return NextResponse.json(
      { error: 'Erro ao criar tipo de medida' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { id, name, description } = data;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const type = await prisma.measurementType.update({
      where: { id },
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json(type);
  } catch (error) {
    console.error('Erro ao atualizar tipo de medida:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tipo de medida' },
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const measurementType = await prisma.measurementType.findUnique({
      where: { id },
    });

    if (!measurementType) {
      return NextResponse.json(
        { error: 'Tipo de medida não encontrado' },
        { status: 404 }
      );
    }

    const protectedTypes = [
      'Pescoço', 'Cintura', 'Quadril',
      'Peitoral', // Girth or Skinfold keys
      'Dobra Cutânea - Peitoral',
      'Dobra Cutânea - Axilar Média',
      'Dobra Cutânea - Tríceps',
      'Dobra Cutânea - Subescapular',
      'Dobra Cutânea - Abdominal',
      'Dobra Cutânea - Suprailíaca',
      'Dobra Cutânea - Coxa',
      'Bíceps Esquerdo', 'Bíceps Direito',
      'Antebraço Esquerdo', 'Antebraço Direito',
      'Coxa Esquerda', 'Coxa Direita',
      'Panturrilha Esquerda', 'Panturrilha Direita'
    ];

    if (protectedTypes.includes(measurementType.name)) {
      return NextResponse.json(
        { error: 'Este tipo de medida é essencial para o sistema e não pode ser excluído.' },
        { status: 403 }
      );
    }

    await prisma.measurementType.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tipo de medida excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tipo de medida:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir tipo de medida' },
      { status: 500 }
    );
  }
}

