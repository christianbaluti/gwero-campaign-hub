export type DocumentAccessLevel = "view" | "edit" | "manage";

export type ManagedAttachment = {
  path: string;
  name: string;
  type: string;
  size: number;
};

export type DocumentCategoryRecord = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type DocumentUserRecord = {
  id: string;
  fullName: string;
  email: string;
};

export type DocumentVersionRecord = {
  id: string;
  documentId: string;
  versionNumber: number;
  attachmentPath: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

export type DocumentGrantRecord = {
  userId: string;
  userName: string;
  userEmail: string;
  accessLevel: DocumentAccessLevel;
};

export type ManagedDocumentRecord = {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  entityType: string;
  entityId: string;
  ownerId: string;
  ownerName: string;
  status: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  accessLevel: DocumentAccessLevel;
  updatedAt: string;
  versions: DocumentVersionRecord[];
  grants: DocumentGrantRecord[];
};

export type DocumentWorkspace = {
  documents: ManagedDocumentRecord[];
  categories: DocumentCategoryRecord[];
  users: DocumentUserRecord[];
  currentUserId: string;
};
