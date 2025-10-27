'use client';

import { useQueryState } from 'nuqs';
import * as React from 'react';
import { useTranslations } from 'next-intl';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type FlagConfig, flagConfig } from '@/config/flag';

type FilterFlag = FlagConfig[number]['key'];

interface FeatureFlagsContextValue {
  filterFlag: FilterFlag;
  enableAdvancedFilter: boolean;
}

const FeatureFlagsContext =
  React.createContext<FeatureFlagsContextValue | null>(null);

export function useFeatureFlags() {
  const context = React.useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      'useFeatureFlags must be used within a FeatureFlagsProvider'
    );
  }
  return context;
}

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
  tableId: string;
}

export function FeatureFlagsProvider({
  children,
  tableId,
}: FeatureFlagsProviderProps) {
  const t = useTranslations('FeatureFlags');
  const queryParamKey = `${tableId}FilterFlag`;

  const [filterFlag, setFilterFlag] = useQueryState<FilterFlag | null>(
    queryParamKey,
    {
      parse: (value) => {
        if (!value) return null;
        const validValues = flagConfig.map((flag) => flag.key);
        return validValues.includes(value as FilterFlag)
          ? (value as FilterFlag)
          : null;
      },
      serialize: (value) => value ?? '',
      defaultValue: null,
      clearOnDefault: true,
      shallow: false,
      eq: (a, b) => (!a && !b) || a === b,
    }
  );

  const onFilterFlagChange = React.useCallback(
    (value: FilterFlag) => {
      setFilterFlag(value);
    },
    [setFilterFlag]
  );

  const contextValue = React.useMemo<FeatureFlagsContextValue>(
    () => ({
      filterFlag,
      enableAdvancedFilter:
        filterFlag === 'advancedFilters' || filterFlag === 'commandFilters',
    }),
    [filterFlag]
  );

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      <div className="w-full overflow-x-auto p-1">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filterFlag}
          onValueChange={onFilterFlagChange}
          className="w-fit gap-0"
        >
          {flagConfig.map((flag) => (
            <Tooltip key={flag.key} delayDuration={700}>
              <ToggleGroupItem
                value={flag.key}
                className="whitespace-nowrap px-3 text-xs data-[state=on]:bg-accent/70 data-[state=on]:hover:bg-accent/90"
                asChild
              >
                <TooltipTrigger>
                  <flag.icon className="size-3.5 shrink-0" />
                  {t(`${flag.key}.label`)}
                </TooltipTrigger>
              </ToggleGroupItem>
              <TooltipContent
                align="start"
                side="bottom"
                sideOffset={6}
                className="flex flex-col gap-1.5 border bg-background py-2 font-semibold text-foreground [&>span]:hidden"
              >
                <div>{t(`${flag.key}.tooltipTitle`)}</div>
                <p className="text-balance text-muted-foreground text-xs">
                  {t(`${flag.key}.tooltipDescription`)}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </div>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
