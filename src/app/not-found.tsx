import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4">404 — page not found</Typography>
        <Button component={Link} href="/library" variant="contained">
          Back to library
        </Button>
      </Stack>
    </Box>
  );
}
