import type { Metadata } from 'next';
import { MethodologyPageClient } from './MethodologyPageClient';

export const metadata: Metadata = {
  title: 'Methodology',
};

export default function MethodologyPage() {
  return <MethodologyPageClient />;
}
