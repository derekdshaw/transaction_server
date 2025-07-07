import { GraphQLClient } from 'graphql-hooks';
import createCache from 'graphql-hooks-memcache';

const cache = createCache({
  // Optional cache configuration
  size: 1000, // Maximum number of items to store in cache
  ttl: 3600000, // Time to live in milliseconds (1 hour)
});

export const client = new GraphQLClient({
  url: import.meta.env.VITE_GRAPHQL_URL,
  cache: cache,
});
