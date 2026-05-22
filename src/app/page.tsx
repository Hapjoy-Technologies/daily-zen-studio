'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function RootPage() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/library');
  }, [router]);
  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}
