export type AdminSiteReview = {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
