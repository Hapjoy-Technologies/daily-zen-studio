'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

/**
 * Legacy /past path. Past months are now editable in /months — redirect
 * old bookmarks there.
 */
export default function PastLegacyRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/months');
  }, [router]);
  return (
    <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}
