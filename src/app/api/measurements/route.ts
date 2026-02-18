import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in POST:', session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { weight, date, time, studentId, measurementValues } = data;

    if (!weight || !date) {
      return NextResponse.json(
        { error: 'Peso e data são obrigatórios' },
        { status: 400 }
      );
    }

    // Determina o userId: se for professor e tiver studentId, usa o studentId; senão usa o próprio id
    let targetUserId = session.user.id;
    if (studentId && session.user.role === 'PROFESSOR') {
      // Verifica se o aluno pertence ao professor
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          professorId: session.user.id,
        },
      });
      if (!student) {
        return NextResponse.json(
          { error: 'Aluno não encontrado ou não vinculado a este professor' },
          { status: 403 }
        );
      }
      targetUserId = studentId;
    }

    // Verifica se já existe uma medição para o mesmo dia
    const existingMeasurement = await prisma.measurement.findFirst({
      where: {
        userId: targetUserId,
        date: new Date(date),
      },
    });

    if (existingMeasurement) {
      return NextResponse.json(
        { error: 'Já existe uma medição registrada para esta data' },
        { status: 400 }
      );
    }

    // Combina a data com o horário
    const [hours, minutes] = (time || '12:00').split(':');
    const [year, month, day] = date.split('-').map(Number);
    const dateTime = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0);

    // Cria a medição com os valores
    const measurement = await prisma.measurement.create({
      data: {
        userId: targetUserId,
        weight,
        date: dateTime,
        values: measurementValues
          ? {
            create: measurementValues.map((mv: { typeId: string; value: number }) => ({
              typeId: mv.typeId,
              value: mv.value,
            })),
          }
          : undefined,
      },
      include: {
        values: {
          include: {
            type: true,
          },
        },
      },
    });

    console.log('Medição criada:', measurement);

    return NextResponse.json(measurement);
  } catch (error) {
    console.error('Erro ao criar medição:', error);
    return NextResponse.json(
      { error: 'Erro ao criar medição' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in PUT:', session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { id, weight, date, time, measurementValues } = data;

    if (!id || !weight || !date) {
      return NextResponse.json(
        { error: 'ID, peso e data são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se a medição pertence ao usuário
    const existingMeasurement = await prisma.measurement.findUnique({
      where: { id },
    });

    if (!existingMeasurement) {
      return NextResponse.json(
        { error: 'Medição não encontrada' },
        { status: 404 }
      );
    }

    const isOwner = existingMeasurement.userId === session.user.id;
    let isProfessor = false;

    if (!isOwner && session.user.role === 'PROFESSOR') {
      const student = await prisma.user.findFirst({
        where: {
          id: existingMeasurement.userId,
          professorId: session.user.id,
        },
      });
      if (student) isProfessor = true;
    }

    if (!isOwner && !isProfessor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Verifica se já existe outra medição para o mesmo dia (exceto a atual)
    const duplicateMeasurement = await prisma.measurement.findFirst({
      where: {
        userId: existingMeasurement.userId, // Use the original user's ID
        date: new Date(date),
        id: { not: id },
      },
    });

    if (duplicateMeasurement) {
      return NextResponse.json(
        { error: 'Já existe uma medição registrada para esta data' },
        { status: 400 }
      );
    }

    // Combina a data com o horário
    const [hours, minutes] = (time || '12:00').split(':');
    const [year, month, day] = date.split('-').map(Number);
    const dateTime = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0);

    // Transaction to update measurement and replace values
    const measurement = await prisma.$transaction(async (tx) => {
      // 1. Update main measurement details
      const updated = await tx.measurement.update({
        where: { id },
        data: {
          weight,
          date: dateTime,
        },
      });

      // 2. Delete existing values
      await tx.measurementValue.deleteMany({
        where: { measurementId: id },
      });

      // 3. Create new values
      if (measurementValues && measurementValues.length > 0) {
        await tx.measurementValue.createMany({
          data: measurementValues.map((mv: { typeId: string; value: number }) => ({
            measurementId: id,
            typeId: mv.typeId,
            value: mv.value,
          })),
        });
      }

      return updated;
    });

    // Fetch complete updated measurement with values
    const finalMeasurement = await prisma.measurement.findUnique({
      where: { id },
      include: {
        values: {
          include: {
            type: true,
          },
        },
      },
    });

    return NextResponse.json(measurement);
  } catch (error) {
    console.error('Erro ao atualizar medição:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar medição' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in DELETE:', session);

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
        { error: 'ID da medição é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica permissão: dono da medição OU professor vinculado ao aluno
    const existingMeasurement = await prisma.measurement.findUnique({
      where: { id },
    });

    if (!existingMeasurement) {
      return NextResponse.json(
        { error: 'Medição não encontrada' },
        { status: 404 }
      );
    }

    const isOwner = existingMeasurement.userId === session.user.id;
    let isProfessor = false;

    if (!isOwner && session.user.role === 'PROFESSOR') {
      const student = await prisma.user.findFirst({
        where: {
          id: existingMeasurement.userId,
          professorId: session.user.id,
        },
      });
      if (student) isProfessor = true;
    }

    if (!isOwner && !isProfessor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    await prisma.measurement.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Medição excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir medição:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir medição' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in GET:', session);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Determina o userId: se for professor e tiver studentId, usa o studentId; senão usa o próprio id
    let targetUserId = session.user.id;
    if (studentId && session.user.role === 'PROFESSOR') {
      // Verifica se o aluno pertence ao professor
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          professorId: session.user.id,
        },
      });
      if (student) {
        targetUserId = studentId;
      }
    } else if (session.user.role === 'PROFESSOR') {
      // Se for professor sem studentId, retorna vazio ou todos os alunos
      // Por enquanto, retorna vazio
      return NextResponse.json([]);
    }

    const measurements = await prisma.measurement.findMany({
      where: { userId: targetUserId },
      include: {
        values: {
          include: {
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    console.log('Medições encontradas:', measurements);

    // Formata as datas antes de retornar
    const formattedMeasurements = measurements.map(measurement => ({
      ...measurement,
      date: measurement.date.toISOString(),
    }));

    return NextResponse.json(formattedMeasurements);
  } catch (error) {
    console.error('Erro ao buscar medições:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar medições', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 