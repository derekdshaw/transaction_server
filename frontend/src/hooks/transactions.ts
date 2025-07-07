import { useQuery, useMutation, UseClientRequestOptions } from 'graphql-hooks';

interface AllTransactionData {
  allTransactions: Transaction[];
}

interface TransactionData {
  transactionsByDateRange: Transaction[];
}

interface CategorySummaryData {
  transactionsSummaryByCategory: CategorySummary[];
}

export interface CategorySummary {
    categoryId: number;
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  categoryName: string;
  categoryId: number;
}

export const GET_TRANSACTIONS = `
  query GetTransactions {
    allTransactions {
      id
      date
      amount
      description
      categoryName
      categoryId
    }
  }
`;

export const useTransactions = () => {
  const { data, loading, error, refetch } = useQuery<AllTransactionData>(GET_TRANSACTIONS);

  return {
    transactions: data?.allTransactions || [],
    loading,
    error,
    refetch,
  };
};

export const GET_TRANSACTIONS_BY_DATE_RANGE = `
  query GetTransactionsByDateRange($startDate: String!, $endDate: String!) {
    transactionsByDateRange(startDate: $startDate, endDate: $endDate) {
      id
      date
      amount
      description
      categoryName
      categoryId
    }
  }
`;

export const useTransactionsByDateRange = (startDate: string | null, endDate: string | null) => {
  if(!startDate || !endDate) {
    return {
      transactions: [],
      loading: false,
      error: null,
      refetch: () => {}
    };
  }

  const { data, loading, error, refetch } = useQuery<TransactionData>(GET_TRANSACTIONS_BY_DATE_RANGE, {
    variables: { startDate, endDate },
    skip: !startDate || !endDate
  });

  return {
    transactions: data?.transactionsByDateRange || [],
    loading,
    error,
    refetch,
  };
};

export const GET_TRANSACTIONS_SUMMARY_BY_CATEGORY = `
  query GetTransactionsSummaryByCategory($startDate: String!, $endDate: String!) {
    transactionsSummaryByCategory(startDate: $startDate, endDate: $endDate) {
      categoryId
      categoryName
      totalAmount
      transactionCount
    }
  }
`;

export const useTransactionsSummaryByCategory = (startDate: string, endDate: string) => {
  const { data, loading, error, refetch } = useQuery<CategorySummaryData>(GET_TRANSACTIONS_SUMMARY_BY_CATEGORY, {
    variables: { startDate, endDate },
    skip: !startDate || !endDate
  });

  return {
    categorySummaries: data?.transactionsSummaryByCategory || [],
    loading,
    error,
    refetch
  };
};

export const UPDATE_TRANSACTION = `
  mutation UpdateTransaction($id: Int!, $amount: Float!, $description: String!, $date: String!, $categoryId: Int!) {
    updateTransaction(id: $id, amount: $amount, description: $description, date: $date, categoryId: $categoryId) {
      id
      date
      amount
      description
      categoryId
      categoryName
    }
  }
`;

interface UpdateTransactionVars {
  id: number;
  amount: number;
  description: string;
  date: string;
  categoryId: number;
}

export const useUpdateTransaction = () => {
  const [mutate, { loading, error, data }] = useMutation<{ 
    updateTransaction: Transaction 
  }, UpdateTransactionVars>(UPDATE_TRANSACTION);

  const updateTransaction = async (id: string, amount: number, description: string, date: string, categoryId: number) => {
    try {
      // Convert string ID to number for the backend
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid transaction ID');
      }

      const result = await mutate({
        variables: {
          id: numericId,
          amount,
          description,
          date,
          categoryId
        },
        // Remove the update callback as it's causing type issues
        // The cache will be updated automatically by the mutation result
      });
      
      return result;
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err;
    }
  };

  return { 
    updateTransaction, 
    loading, 
    error, 
    data: data?.updateTransaction 
  };
};
