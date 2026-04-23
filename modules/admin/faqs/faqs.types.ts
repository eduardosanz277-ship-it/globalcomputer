export type FaqAdmin = {
  id: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FaqAdminInsert = {
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  active: boolean;
};

export type FaqAdminUpdate = FaqAdminInsert;
