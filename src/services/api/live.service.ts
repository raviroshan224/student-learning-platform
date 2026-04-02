import client from './client';

export type ZoomJoinTokenResponse = {
  // Direct URL approaches
  meetingUrl?: string;
  joinUrl?: string;
  zoomUrl?: string;
  webUrl?: string;
  // Zoom Meeting SDK fields
  signature?: string;
  sdkKey?: string;
  appKey?: string;
  // Meeting details (to construct zoom web URL)
  meetingNumber?: string | number;
  meetingId?: string | number;
  password?: string;
  passWord?: string;
  meetingPassword?: string;
  // User context
  userName?: string;
  userEmail?: string;
  // Generic token
  token?: string;
  sessionName?: string;
};

export const LiveService = {
  myClasses: (params?: {
    status?: 'ongoing' | 'upcoming' | 'completed';
    courseId?: string;
    subjectId?: string;
    page?: number;
    limit?: number;
  }) => client.get<any[]>('/live-classes/my-classes', { params }),

  getDetail: (id: string) =>
    client.get<any>(`/live-classes/${id}`),

  canJoin: (id: string) =>
    client.get<{ canJoin: boolean; reason?: string }>(`/live-classes/${id}/can-join`),

  joinToken: (id: string) =>
    client.post<ZoomJoinTokenResponse>(`/live-classes/${id}/join-token`),
};
