export type WSPayload = {
  t: 'sync';
  id: string;
  text: string;
  ts: number;
};