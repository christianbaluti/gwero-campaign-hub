export type GlobalSearchGroup =
  "People" | "Relationships" | "Opportunities" | "Work" | "Documents & finance" | "Communication";

export type GlobalSearchResult = {
  id: string;
  kind: string;
  group: GlobalSearchGroup;
  typeLabel: string;
  title: string;
  subtitle: string;
  meta: string;
  url: string;
  score: number;
};
