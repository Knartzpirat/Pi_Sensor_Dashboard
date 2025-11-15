import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

export interface GetMeasurementsInput {
  page?: number;
  perPage?: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
  filters?: {
    id: string;
    value: unknown;
  }[];
}

export async function getMeasurements(input: GetMeasurementsInput) {
  noStore();

  const {
    page = 1,
    perPage = 10,
    sort = [{ id: 'startTime', desc: true }],
    filters = [],
  } = input;

  const offset = (page - 1) * perPage;

  // Build where clause from filters
  const where: any = {};

  for (const filter of filters) {
    if (filter.id === 'title') {
      where.title = {
        contains: String(filter.value),
        mode: 'insensitive',
      };
    }

    if (filter.id === 'status') {
      if (Array.isArray(filter.value)) {
        where.status = {
          in: filter.value,
        };
      } else {
        where.status = filter.value;
      }
    }

    if (filter.id === 'startTime') {
      // Handle date filters
      where.startTime = filter.value;
    }
  }

  // Build orderBy
  const orderBy = sort?.map((s) => ({
    [s.id]: s.desc ? 'desc' : 'asc',
  })) ?? [{ startTime: 'desc' }];

  // Get measurements with relations
  const [measurements, total] = await Promise.all([
    prisma.measurement.findMany({
      where,
      include: {
        measurementSensors: {
          include: {
            sensor: true,
            testObject: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: orderBy.length > 0 ? orderBy : [{ startTime: 'desc' }],
      take: perPage,
      skip: offset,
    }),
    prisma.measurement.count({ where }),
  ]);

  const pageCount = Math.ceil(total / perPage);

  return {
    data: measurements,
    pageCount,
  };
}

export async function getMeasurementById(id: string) {
  noStore();

  const measurement = await prisma.measurement.findUnique({
    where: { id },
    include: {
      measurementSensors: {
        include: {
          sensor: {
            include: {
              entities: true,
            },
          },
          testObject: true,
        },
      },
      readings: {
        orderBy: {
          timestamp: 'asc',
        },
      },
    },
  });

  return measurement;
}

