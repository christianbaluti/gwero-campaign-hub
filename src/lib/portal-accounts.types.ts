export type PortalAccountSummary = {
  id: string;
  portalName: string;
  category: string;
  portalUrl: string;
  websiteUrl: string;
  notes: string;
  status: string;
  createdByName: string;
  updatedAt: string;
  hasCredentials: boolean;
};

export type PortalCredentials = {
  loginIdentifier: string;
  accountNumber: string;
  password: string;
  recoveryEmail: string;
  recoveryPhone: string;
};

export type PortalAccountInput = {
  id?: string;
  portalName: string;
  category: string;
  portalUrl: string;
  websiteUrl: string;
  notes: string;
  credentials?: PortalCredentials;
};
