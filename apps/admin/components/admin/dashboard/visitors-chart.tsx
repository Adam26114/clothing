'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@workspace/ui/components/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { ToggleGroup, ToggleGroupItem } from '@workspace/ui/components/toggle-group';
import { t } from '@workspace/lib/i18n';

import { getVisitorsSeries, type VisitorsRange } from '@/lib/visitors-seed';

const RANGE_OPTIONS: ReadonlyArray<{ value: VisitorsRange; labelKey: string }> = [
  { value: '3mo', labelKey: 'admin.dashboard.range3mo' },
  { value: '30d', labelKey: 'admin.dashboard.range30d' },
  { value: '7d', labelKey: 'admin.dashboard.range7d' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-2)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

function isVisitorsRange(value: string): value is VisitorsRange {
  return value === '7d' || value === '30d' || value === '3mo';
}

export function VisitorsChart() {
  const isMobile = useIsMobile();
  const [range, setRange] = React.useState<VisitorsRange>('3mo');
  const [prevIsMobile, setPrevIsMobile] = React.useState(isMobile);

  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (isMobile) {
      setRange('7d');
    }
  }

  const data = React.useMemo(() => getVisitorsSeries(range), [range]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t('admin.dashboard.visitorsChart')}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">{t('admin.dashboard.range3mo')}</span>
          <span className="@[540px]/card:hidden">{t('admin.dashboard.range3mo')}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            value={[range]}
            onValueChange={(value) => {
              const next = value[0];
              if (next && isVisitorsRange(next)) {
                setRange(next);
              }
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4 @[767px]/card:flex"
          >
            {RANGE_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} className="cursor-pointer">
                {t(option.labelKey)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select
            value={range}
            onValueChange={(value) => {
              if (value !== null && isVisitorsRange(value)) {
                setRange(value);
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 cursor-pointer **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select range"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {RANGE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer rounded-lg"
                >
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(String(value)).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
