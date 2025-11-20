export function getQuickSuggestions(pathname: string): string[] {
  const map: Record<string, string[]> = {
    '/': [
      'How do I analyze an occupation?',
      'What does APO mean?',
      'Show me where to start',
    ],
    '/ai-impact-planner': [
      'How do I assess a task?',
      'What skills should I learn?',
      'Explain the categories Automate/Augment/Human-only',
    ],
    '/dashboard': [
      'Where are my saved analyses?',
      'How do I export results?',
      'How do I compare occupations?',
    ],
    '/impact': [
      'What are the key metrics here?',
      'How do I interpret the trends?',
    ],
  };
  return map[pathname] || map['/'];
}
