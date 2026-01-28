export interface SimpleUpdateData {
  version: string;
  date: Date;
  description: string;
  link: string;
}

export interface IUpdateFetcher {
  readonly toolName: string;
  fetchUpdates(): Promise<SimpleUpdateData[]>;
}