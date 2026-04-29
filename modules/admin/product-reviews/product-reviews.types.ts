export type AdminProductReview = {
  id: string;
  productId: string;
  productName: string;
  productNameEn: string | null;
  userId: string | null;
  reviewerName: string;
  reviewerEmail: string | null;
  rating: number;
  comment: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
