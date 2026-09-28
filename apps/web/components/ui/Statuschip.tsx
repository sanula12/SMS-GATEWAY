'use client';

import { Chip, ChipProps } from '@mui/material';

type Status =
    | 'delivered' | 'approved' | 'active' | 'completed' | 'sent'
    | 'pending' | 'scheduled' | 'processing'
    | 'failed' | 'rejected' | 'suspended'
    | 'cancelled' | 'draft'
    | string;

const statusMap: Record<string, { color: ChipProps['color']; label: string }> = {
    delivered: { color: 'success', label: 'Delivered' },
    approved: { color: 'success', label: 'Approved' },
    active: { color: 'success', label: 'Active' },
    completed: { color: 'success', label: 'Completed' },
    sent: { color: 'success', label: 'Sent' },
    pending: { color: 'warning', label: 'Pending' },
    scheduled: { color: 'info', label: 'Scheduled' },
    processing: { color: 'warning', label: 'Processing' },
    failed: { color: 'error', label: 'Failed' },
    rejected: { color: 'error', label: 'Rejected' },
    suspended: { color: 'error', label: 'Suspended' },
    cancelled: { color: 'default', label: 'Cancelled' },
    draft: { color: 'default', label: 'Draft' },
};

interface StatusChipProps {
    status: Status;
    size?: ChipProps['size'];
}

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
    const cfg = statusMap[status?.toLowerCase()] ?? { color: 'default' as const, label: status };
    return (
        <Chip
            label={cfg.label}
            color={cfg.color}
            size={size}
            sx={{ fontWeight: 600, fontSize: '0.72rem', letterSpacing: 0.3 }}
        />
    );
}