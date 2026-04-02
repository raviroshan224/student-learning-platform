import client from './client';

export const LiveService = {
  myClasses: (params?: {
    status?: 'ongoing' | 'upcoming' | 'completed';
    courseId?: string;
    subjectId?: string;
    page?: number;
    limit?: number;
  }) => client.get<any[]>('/live-classes/my-classes', { params }),

  getDetail: (id: string) =>
    client.get<any>(`/live-classes/my-classes/${id}`),

  joinToken: (id: string) =>
    client.post<{
      token?: string;
      meetingUrl?: string;
      joinUrl?: string;
      sessionName?: string;
      userName?: string;
      meetingId?: string;
      password?: string;
    }>(`/live-classes/${id}/join-token`),
};
