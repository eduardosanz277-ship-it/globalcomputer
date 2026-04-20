export type FaqAdmin = {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FaqAdminInsert = {
  question: string;
  answer: string;
  active: boolean;
};

export type FaqAdminUpdate = FaqAdminInsert;
