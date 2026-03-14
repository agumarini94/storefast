import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useStore(slug) {
  return useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      const { data } = await axios.get(`/api/stores/public/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}
