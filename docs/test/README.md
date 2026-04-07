# Test Feature Documentation Portfolio

This repository contains the technical documentation for the "Test" (mock tests / test session) feature, extracted from the OLP Flutter mobile app and formatted for a Next.js web migration.

## Table of Contents

- [**APIs.md**](./APIs.md): Full HTTP endpoint reference with cURL examples.
- [**Models.md**](./Models.md): TypeScript interfaces and JSON payload examples.
- [**UI.md**](./UI.md): Screen mapping, navigation flows, and web component requirements.
- [**Behavior.md**](./Behavior.md): State machines, timer logic, and business rules.
- [**Migration-Checklist.md**](./Migration-Checklist.md): Step-by-step plan for the web implementation.
- [**NOTES.md**](./NOTES.md): Known pitfalls and architectural recommendations.

---

## Feature Overview

The "Test" feature is a robust mock examination engine with the following core capabilities:

1.  **Enormous Scale:** Supports 100+ questions per session with efficient incremental fetching.
2.  **Anti-Cheat:** Automatic test submission if the app remains in the background for more than 10 seconds.
3.  **Resilience:** Full session recovery from server state even after hard app crashes or device restarts.
4.  **Instant Feedback:** Immediate answer persistence and session synchronization for every user interaction.

---

## Web Snippets (Next.js)

### Recommended API Client
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://scholargyan.onecloudlab.com/api/v1/',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const TestService = {
  startSession: (mockTestId: string) => 
    api.post('/test-sessions/start', { mockTestId }),
  submitAnswer: (sessionId: string, index: number, optionKey: string) =>
    api.patch(`/test-sessions/${sessionId}/answer`, { 
      questionIndex: index, 
      selectedAnswer: optionKey 
    }),
};
```

### Server-Driven Timer Component
```tsx
import { useEffect, useState } from 'react';

const TestTimer = ({ endsAt }: { endsAt: string }) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
    };
    
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const format = (s: number) => 
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return <div className="timer">{format(remaining)}</div>;
};
```
