import { useQuery } from 'graphql-hooks';

export interface Category {
    id: number;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }

  export const GET_CATEGORIES = `
  query GetCategories {
    categories {
      id
      name
      description
      icon
      color
    }
  }
`;

interface CategoriesData {
  categories: Category[];
}

export const useCategories = () => {
  const { data, loading, error, refetch } = useQuery<CategoriesData>(GET_CATEGORIES);

  return {
    categories: data?.categories || [],
    loading,
    error,
    refetch,
  };
};