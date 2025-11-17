import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { getPrismaClient } from '@/lib/prisma';
import type { MeasurementWhereInput } from '@/types';

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
  const where: MeasurementWhereInput = {};

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
          in: filter.value as string[],
        };
      } else {
        where.status = filter.value as string;
      }
    }

    if (filter.id === 'startTime') {
      // Handle date filters - convert timestamp to Date range
      const value = filter.value;

      if (typeof value === 'string') {
        // If it's a timestamp string, convert to Date range for whole day
        const timestamp = parseInt(value, 10);
        if (!isNaN(timestamp)) {
          const date = new Date(timestamp);
          // Set to start of day
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          // Set to end of day
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          where.startTime = {
            gte: startOfDay,
            lte: endOfDay,
          };
        }
      } else if (typeof value === 'number') {
        // Single timestamp - convert to date range for whole day
        const date = new Date(value);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        where.startTime = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else if (value instanceof Date) {
        // Single Date - convert to date range for whole day
        const startOfDay = new Date(value);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(value);
        endOfDay.setHours(23, 59, 59, 999);

        where.startTime = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else if (typeof value === 'object' && value !== null) {
        // Handle complex date filter objects (e.g., {gte: "timestamp", lte: "timestamp"})
        const dateFilter: Record<string, Date> = {};
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
          if (typeof val === 'string') {
            const timestamp = parseInt(val, 10);
            if (!isNaN(timestamp)) {
              dateFilter[key] = new Date(timestamp);
            }
          } else if (typeof val === 'number') {
            dateFilter[key] = new Date(val);
          } else if (val instanceof Date) {
            dateFilter[key] = val;
          }
        }
        if (Object.keys(dateFilter).length > 0) {
          where.startTime = dateFilter;
        }
      }
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

