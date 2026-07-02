'use client';

import * as React from 'react';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

export interface SectionCard {
  title: string;
  value: string;
  trendPct?: number;
  trendDirection?: 'up' | 'down';
  footerPrimary: string;
  footerSecondary: string;
}

function formatTrend(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function trendIconDirection(pct: number, override?: 'up' | 'down'): 'up' | 'down' | 'flat' {
  if (override === 'up' || override === 'down') {
    return override;
  }
  if (pct > 0) {
    return 'up';
  }
  if (pct < 0) {
    return 'down';
  }
  return 'flat';
}

function SectionCardItem({ card }: { card: SectionCard }) {
  const hasTrend = typeof card.trendPct === 'number';
  const trendValue = hasTrend ? (card.trendPct as number) : 0;
  const direction = hasTrend ? trendIconDirection(trendValue, card.trendDirection) : 'flat';

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{card.title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {card.value}
        </CardTitle>
        {hasTrend ? (
          <CardAction>
            {direction === 'up' ? (
              <Badge variant="outline">
                <TrendingUpIcon aria-hidden />
                {formatTrend(trendValue)}
              </Badge>
            ) : direction === 'down' ? (
              <Badge variant="outline">
                <TrendingDownIcon aria-hidden />
                {formatTrend(trendValue)}
              </Badge>
            ) : (
              <Badge variant="outline">0.0%</Badge>
            )}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">{card.footerPrimary}</div>
        <div className="text-muted-foreground">{card.footerSecondary}</div>
      </CardFooter>
    </Card>
  );
}

export function SectionCards({ cards }: { cards: ReadonlyArray<SectionCard> }): React.JSX.Element {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <SectionCardItem key={`${card.title}-${index}`} card={card} />
      ))}
    </div>
  );
}
