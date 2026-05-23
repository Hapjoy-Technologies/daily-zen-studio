'use client';
import * as React from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import type { LibraryCard } from '@/lib/api/types';
import { themeAccent } from '@/lib/theme/tokens';
import { ThemeChip } from './ThemeChip';

/**
 * Large preview of a library card. Backdrop = latestBgImageUrl, foreground =
 * latestDzImageUrl (composited the way the apps render it). Goes full-screen
 * on small viewports.
 */
export function ImageViewerDialog({
  card,
  open,
  onClose,
}: {
  card: LibraryCard;
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const accent = themeAccent[card.theme] ?? '#E84A7A';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      // Stop clicks inside the dialog (e.g., the close button) from bubbling
      // back to the parent row's onClick.
      onClick={(e) => e.stopPropagation()}
    >
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.5 }}
          >
            <ThemeChip theme={card.theme} />
            <IconButton onClick={onClose} aria-label="Close preview" size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              // Soft per-theme tint behind the dz image — only visible if the
              // dz image is missing or has transparent regions.
              backgroundImage: `linear-gradient(135deg, ${alpha(accent, 0.16)} 0%, ${alpha(accent, 0.04)} 100%)`,
            }}
          >
            {card.latestDzImageUrl && (
              <Box
                component="img"
                src={card.latestDzImageUrl}
                alt={card.text || card.themeTitle || 'Daily Zen card'}
                loading="eager"
                decoding="async"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}
          </Box>

          {(card.text || card.author || card.articleUrl) && (
            <Stack spacing={0.5} sx={{ px: 2.5, py: 2 }}>
              {card.text && (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {card.text}
                </Typography>
              )}
              {card.author && (
                <Typography variant="caption" color="text.secondary">
                  — {card.author}
                </Typography>
              )}
              {card.articleUrl && (
                <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
                  <MuiLink href={card.articleUrl} target="_blank" rel="noreferrer" underline="hover">
                    Linked article <OpenInNewRoundedIcon sx={{ fontSize: 12, verticalAlign: '-2px' }} />
                  </MuiLink>
                </Typography>
              )}
            </Stack>
          )}

          {card.latestDzImageUrl && (
            <Stack
              direction="row"
              gap={2}
              sx={{
                px: 2.5,
                py: 1.5,
                borderTop: (t) => `1px solid ${t.palette.divider}`,
              }}
            >
              <MuiLink
                href={card.latestDzImageUrl}
                target="_blank"
                rel="noreferrer"
                underline="hover"
                variant="caption"
              >
                Open image in new tab <OpenInNewRoundedIcon sx={{ fontSize: 12, verticalAlign: '-2px' }} />
              </MuiLink>
            </Stack>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
