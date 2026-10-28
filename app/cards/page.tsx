import type { Metadata } from 'next';
import { CardsPageClient } from './CardsPageClient';

export const metadata: Metadata = {
  title: 'Cards',
};

export default function CardsPage() {
  return <CardsPageClient />;
}
