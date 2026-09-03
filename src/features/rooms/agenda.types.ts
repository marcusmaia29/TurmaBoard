export interface AgendaResponse {
  date: string;
  sourceGeneratedAt: string | null;
  fetchedAt: string;
  events: AgendaEvent[];
}

export interface AgendaEvent {
  id: string;
  date: string;
  type: string;
  start: string;
  end: string;
  className: string;
  title: string;
  professor: string;
  room: string;
  floor: string;
  building: string;
  courseFamily: string;
  cancelled: boolean;
}
