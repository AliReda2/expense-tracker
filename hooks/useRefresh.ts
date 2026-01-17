import { useCallback, useState } from 'react';

export const useRefresh = (loadData: () => Promise<void>) => {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadData();
        } finally {
            setRefreshing(false);
        }
    }, [loadData]);

    return { refreshing, onRefresh };
};
