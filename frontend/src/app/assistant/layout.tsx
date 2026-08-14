import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aharyas Assistant | AI-Powered Shopping Help',
  description: 'Chat with the Aharyas AI assistant for product recommendations, order help, and styling advice.',
};

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
