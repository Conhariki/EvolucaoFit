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
    const { weight, chest, waist, hips, biceps, thighs, date, time } = data;

    if (!weight || !date) {
      return NextResponse.json(
        { error: 'Peso e data são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se já existe uma medição para o mesmo dia
    const existingMeasurement = await prisma.measurement.findFirst({
      where: {
        userId: session.user.id,
        date: new Date(date),
      },
    });

    if (existingMeasurement) {
      return NextResponse.json(
        { error: 'Já existe uma medição registrada para esta data' },
        { status: 400 }
      );
    }

    console.log('Dados recebidos:', {
      userId: session.user.id,
      weight,
      chest,
      waist,
      hips,
      biceps,
      thighs,
      date,
      time,
    });

    // Combina a data com o horário
    const [hours, minutes] = (time || '12:00').split(':');
    const [year, month, day] = date.split('-').map(Number);
    const dateTime = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0);

    const measurement = await prisma.measurement.create({
      data: {
        userId: session.user.id,
        weight,
        chest,
        waist,
        hips,
        biceps,
        thighs,
        date: dateTime,
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
    const { id, weight, chest, waist, hips, biceps, thighs, date, time } = data;

    if (!id || !weight || !date) {
      return NextResponse.json(
        { error: 'ID, peso e data são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se a medição pertence ao usuário
    const existingMeasurement = await prisma.measurement.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingMeasurement) {
      return NextResponse.json(
        { error: 'Medição não encontrada' },
        { status: 404 }
      );
    }

    // Verifica se já existe outra medição para o mesmo dia (exceto a atual)
    const duplicateMeasurement = await prisma.measurement.findFirst({
      where: {
        userId: session.user.id,
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

    const measurement = await prisma.measurement.update({
      where: { id },
      data: {
        weight,
        chest,
        waist,
        hips,
        biceps,
        thighs,
        date: dateTime,
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

    // Verifica se a medição pertence ao usuário
    const existingMeasurement = await prisma.measurement.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingMeasurement) {
      return NextResponse.json(
        { error: 'Medição não encontrada' },
        { status: 404 }
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

    const measurements = await prisma.measurement.findMany({
      where: { userId: session.user.id },
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