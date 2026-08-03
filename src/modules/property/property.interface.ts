export interface ICreateProperty {
  title: string;
  description: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  amenities?: string[];
  images?: string[];
  areaSqft?: number;
  furnishing?: "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED";
  availableFrom?: string;
  categoryId: string;
}

export interface IUpdateProperty {
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  images?: string[];
  areaSqft?: number;
  furnishing?: "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED";
  availableFrom?: string;
  categoryId?: string;
}

export interface IPropertyFilters {
  city?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  search?: string;
  page?: number;
  limit?: number;
}
