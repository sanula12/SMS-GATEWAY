'use client';

import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

export default function EmptyState({
    title = 'No data found',
    description = 'There is nothing to display here yet.',
    icon,
}: EmptyStateProps) {
    return (
        <Box
            sx={{
                py: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                color: 'text.secondary',
            }}
        >
            {icon ?? <InboxIcon sx={{ fontSize: 56, opacity: 0.3 }} />}
            <Typography variant="h6" fontWeight={600} color="text.primary">
                {title}
            </Typography>
            <Typography variant="body2">{description}</Typography>
        </Box>
    );
}