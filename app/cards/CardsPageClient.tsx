'use client';

import { useMemo, useState } from 'react';
import { Filters, type FilterState } from '../../components/card-table/Filters';
import { SearchBox } from '../../components/card-table/SearchBox';
import { Table } from '../../components/card-table/Table';
import {
  sortRows,
  type CardRow,
  type SortDirection,
  type SortKey,
} from '../../components/card-table/columns';
import { ApiInconsistent } from '../../components/empty-states/ApiInconsistent';
import { EmptyState } from '../../components/empty-states/EmptyState';
import { SchemaMismatch } from '../../components/empty-states/SchemaMismatch';
import { StatsStatusBanner } from '../../components/empty-states/StatsStatusBanner';
import { ProvenanceBar } from '../../components/provenance/ProvenanceBar';
import { SliceSelector } from '../../components/slice-selector/SliceSelector';
import type {
  Card,
  CardStat,
  CardType,
  Color,
  Rarity,
} from '../../lib/api/types';
import { useCatalog } from '../../lib/hooks/useCatalog';
import { useSlice } from '../../lib/hooks/useSlice';
import { useDisplayCatalog, useStats } from '../../lib/hooks/useStats';

const DEFAULT_FILTERS: FilterState = {
  color: 'all',
  type: 'all',
  rarity: 'all',
  manaCost: 'all',
  tribe: 'all',
};

function distinctSorted<T>(values: T[], compare?: (a: T, b: T) => number): T[] {
  return Array.from(new Set(values)).sort(compare);
}

function compareNumbers(a: number, b: number): number {
  return a - b;
}

export function CardsPageClient() {
  const catalog = useCatalog();
  const { stats } = useStats();
  // Card data rendered beside statistics comes from the catalog release the
  // statistics describe (docs/data-contract.md rule #3); `catalog` stays
  // the source of truth for the load/error gating below.
  const displayCatalog = useDisplayCatalog();
  const slice = useSlice();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Default filter: collectible: true only (spec §3.2) — every list and
  // chart defaults to this; there is no UI to turn it off, since
  // non-collectible tokens/forms only exist to be referenced from a
  // collectible card's detail page.
  const collectibleCards = useMemo(() => {
    const allCards: Card[] =
      displayCatalog.status === 'ok' ? displayCatalog.data.cards : [];
    return allCards.filter((card) => card.collectible);
  }, [displayCatalog]);

  const options = useMemo(
    () => ({
      colors: distinctSorted(
        collectibleCards.map((card) => card.color),
      ) as Color[],
      types: distinctSorted(
        collectibleCards.map((card) => card.type),
      ) as CardType[],
      rarities: distinctSorted(
        collectibleCards.map((card) => card.rarity),
      ) as Rarity[],
      manaCosts: distinctSorted(
        collectibleCards.map((card) => card.manaCost),
        compareNumbers,
      ),
      tribes: distinctSorted(
        collectibleCards
          .map((card) => card.tribe)
          .filter((tribe): tribe is string => tribe !== null),
      ),
    }),
    [collectibleCards],
  );

  const cardStatById = useMemo(() => {
    if (stats.status !== 'ok') return null;
    const found = slice.findSlice(stats.data.cardStats.slices);
    const map = new Map<string, CardStat>();
    for (const stat of found?.cards ?? []) {
      map.set(stat.id, stat);
    }
    return map;
  }, [stats, slice]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return collectibleCards.filter((card) => {
      if (filters.color !== 'all' && card.color !== filters.color) return false;
      if (filters.type !== 'all' && card.type !== filters.type) return false;
      if (filters.rarity !== 'all' && card.rarity !== filters.rarity)
        return false;
      if (filters.manaCost !== 'all' && card.manaCost !== filters.manaCost)
        return false;
      if (filters.tribe !== 'all' && card.tribe !== filters.tribe) return false;
      if (
        query &&
        !card.name.toLowerCase().includes(query) &&
        !card.description.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [collectibleCards, filters, search]);

  const rows: CardRow[] = useMemo(
    () => filtered.map((card) => ({ card, stat: cardStatById?.get(card.id) })),
    [filtered, cardStatById],
  );
  const sortedRows = useMemo(
    () => sortRows(rows, sortKey, sortDirection),
    [rows, sortKey, sortDirection],
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  if (catalog.status === 'loading') {
    return <p className="text-sm text-neutral-500">Loading cards…</p>;
  }
  if (catalog.status === 'not-deployed') {
    return (
      <EmptyState
        tone="error"
        title="Catalog not available"
        description="The card catalog could not be reached. Please check back soon."
      />
    );
  }
  if (catalog.status === 'schema-mismatch') {
    return <SchemaMismatch got={catalog.got} />;
  }
  if (catalog.status === 'inconsistent') {
    return <ApiInconsistent url={catalog.url} />;
  }
  if (catalog.status === 'network-error') {
    return (
      <EmptyState
        tone="error"
        title="Couldn't load the card catalog"
        description="A network error occurred. Please try again."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ProvenanceBar />
      <SliceSelector
        tierGroup={slice.tierGroup}
        matchType={slice.matchType}
        onChange={slice.setSlice}
      />
      <StatsStatusBanner stats={stats} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox value={search} onChange={setSearch} />
        <Filters value={filters} onChange={setFilters} options={options} />
      </div>
      <p className="text-xs text-neutral-500">
        {sortedRows.length} of {collectibleCards.length} collectible cards
      </p>
      <Table
        rows={sortedRows}
        statsLoaded={stats.status === 'ok'}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        linkQuery={slice.toQueryString()}
        ratePrecision={
          stats.status === 'ok'
            ? stats.data.cardStats.method.ratePrecision
            : undefined
        }
      />
    </div>
  );
}
