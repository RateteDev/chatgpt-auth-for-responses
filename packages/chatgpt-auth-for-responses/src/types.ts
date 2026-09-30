export type CodexAuthOptions = {
  authFile: string;
};

export type ClientOptions = {
  baseURL: string;
  headers: Record<string, string>;
  accessToken: string;
};

export type CodexAuthFile = {
  OPENAI_API_KEY?: string | null;
  tokens?: {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    account_id?: string;
  };
  last_refresh?: string;
};

export type CodexAuth = {
  resolveAccessToken: () => Promise<string>;
  forceRefresh: () => Promise<string>;
  clientOptions: () => Promise<ClientOptions>;
};
