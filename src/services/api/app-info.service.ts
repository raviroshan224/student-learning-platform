import client from './client';

export const AppInfoService = {
  about: () => client.get<{ content: string }>('/app-info/about'),
  terms: () => client.get<{ content: string }>('/app-info/terms'),
  faqs: () => client.get<{ faqs: { question: string; answer: string }[] }>('/app-info/faqs'),
};
