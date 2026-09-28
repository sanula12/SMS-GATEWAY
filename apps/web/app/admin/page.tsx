// 'use client';

// import React, { useEffect, useState } from 'react';
// import {
//   Box, Grid, Card, CardContent, Typography,
//   Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, Paper, Chip, Avatar,
//   CircularProgress, Button,
// } from '@mui/material';
// import PeopleIcon from '@mui/icons-material/People';
// import GroupsIcon from '@mui/icons-material/Groups';
// import MessageIcon from '@mui/icons-material/Message';
// import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
// import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
// import { useRouter } from 'next/navigation';
// import { AccountsService } from '@/lib/services/accounts.service';
// import StatusChip from '@/components/ui/Statuschip';

// interface StatCardProps {
//   title: string;
//   value: string | number;
//   icon: React.ReactNode;
//   color: string;
//   bgcolor: string;
// }

// function StatCard({ title, value, icon, color, bgcolor }: StatCardProps) {
//   return (
//     <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
//       <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
//         <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <Box sx={{ color, '& svg': { fontSize: 26 } }}>{icon}</Box>
//         </Box>
//         <Box>
//           <Typography variant="h5" fontWeight={800}>{value}</Typography>
//           <Typography variant="body2" color="text.secondary">{title}</Typography>
//         </Box>
//       </CardContent>
//     </Card>
//   );
// }

// export default function AdminOverviewPage() {
//   const router = useRouter();
//   const [accounts, setAccounts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     AccountsService.getAll()
//       .then(setAccounts)
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, []);

//   const customers   = accounts.filter(a => a.role === 'customer');
//   const resellers   = accounts.filter(a => a.role === 'reseller');
//   const suspended   = accounts.filter(a => a.status === 'suspended');
//   const totalCredits = accounts.reduce((sum, a) => sum + parseFloat(a.creditBalance ?? '0'), 0);

//   const recent = [...accounts].sort((a, b) =>
//     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//   ).slice(0, 8);

//   return (
//     <Box>
//       {loading ? (
//         <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
//           <CircularProgress />
//         </Box>
//       ) : (
//         <>
//           {/* Stat cards */}
//           <Grid container spacing={2.5} sx={{ mb: 3 }}>
//             <Grid size={{xs: 12, sm: 6, lg: 3}}>
//               <StatCard title="Total Customers" value={customers.length} icon={<PeopleIcon />} color="#f26f2e" bgcolor="#fee8db" />
//             </Grid>
//             <Grid size={{xs: 12, sm: 6, lg: 3}} >
//               <StatCard title="Total Resellers" value={resellers.length} icon={<GroupsIcon />} color="#e53935" bgcolor="#fde8e8" />
//             </Grid>
//             <Grid size={{xs: 12, sm: 6, lg: 3}}>
//               <StatCard title="Suspended" value={suspended.length} icon={<MessageIcon />} color="#ff9800" bgcolor="#fff3e0" />
//             </Grid>
//             <Grid size={{xs: 12, sm: 6, lg: 3}}>
//               <StatCard title="Total Credits" value={totalCredits.toFixed(2)} icon={<AccountBalanceWalletIcon />} color="#4caf50" bgcolor="#e8f5e9" />
//             </Grid>
//           </Grid>

//           {/* Recent accounts */}
//           <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3 }}>
//             <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f2f9' }}>
//               <Typography variant="h6" fontWeight={700}>Recent Accounts</Typography>
//               <Button
//                 endIcon={<ArrowForwardIcon />}
//                 size="small"
//                 onClick={() => router.push('/admin/accounts')}
//                 sx={{ textTransform: 'none' }}
//               >
//                 View all
//               </Button>
//             </Box>
//             <TableContainer>
//               <Table>
//                 <TableHead>
//                   <TableRow sx={{ bgcolor: '#fafbff' }}>
//                     <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</TableCell>
//                     <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</TableCell>
//                     <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Role</TableCell>
//                     <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
//                     <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Credits</TableCell>
//                     <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Joined</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {recent.map((account, i) => (
//                     <TableRow key={account.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f0f4ff' }, cursor: 'pointer' }}
//                       onClick={() => router.push('/admin/accounts')}
//                     >
//                       <TableCell>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                           <Avatar sx={{ width: 30, height: 30, bgcolor: account.role === 'reseller' ? '#e53935' : '#f26f2e', fontSize: '0.75rem' }}>
//                             {account.name?.[0]?.toUpperCase()}
//                           </Avatar>
//                           <Typography variant="body2" fontWeight={600}>{account.name}</Typography>
//                         </Box>
//                       </TableCell>
//                       <TableCell><Typography variant="body2" color="text.secondary">{account.email}</Typography></TableCell>
//                       <TableCell>
//                         <Chip
//                           label={account.role}
//                           size="small"
//                           sx={{
//                             bgcolor: account.role === 'super_admin' ? '#fde8e8' : account.role === 'reseller' ? '#fff3e0' : '#fee8db',
//                             color: account.role === 'super_admin' ? '#e53935' : account.role === 'reseller' ? '#e65100' : '#f26f2e',
//                             fontWeight: 700, fontSize: '0.7rem',
//                           }}
//                         />
//                       </TableCell>
//                       <TableCell><StatusChip status={account.status} /></TableCell>
//                       <TableCell>
//                         <Typography variant="body2" fontWeight={600} sx={{ color: '#4caf50' }}>
//                           ${parseFloat(account.creditBalance ?? '0').toFixed(2)}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <Typography variant="body2" color="text.secondary">
//                           {new Date(account.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
//                         </Typography>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Card>
//         </>
//       )}
//     </Box>
//   );
// }
import AdminOverviewClient from '@/components/admin/Adminoverviewclient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Overview - V SMS',
  description: 'Platform overview and account management.',
};

export default function AdminPage() {
  return <AdminOverviewClient />;
}