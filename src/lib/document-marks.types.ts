export type StampShape = "oval" | "rectangle" | "circle";

export type StampDesign = {
  primaryText: string;
  secondaryText: string;
  includeDate: boolean;
  datePrefix: string;
  color: string;
  shape: StampShape;
  distressed: number;
  rotation: number;
};

export type DocumentMark = {
  id: string;
  name: string;
  type: "stamp" | "signature";
  design: StampDesign | null;
  imagePath: string;
  createdByName: string;
  updatedAt: string;
};

export type MarkingDocument = {
  id: string;
  title: string;
  category: string;
  owner: string;
  attachmentPath: string;
  fileName: string;
  versionNumber: number;
};

export type MarkApplication = {
  id: string;
  sourceName: string;
  outputName: string;
  outputPath: string;
  markName: string;
  markType: "stamp" | "signature";
  pageNumber: number;
  appliedDate: string;
  appliedByName: string;
  createdAt: string;
};
