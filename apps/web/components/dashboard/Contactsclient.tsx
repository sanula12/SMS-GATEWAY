'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Skeleton, IconButton, Tooltip, Divider, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress,
    List, ListItemButton, ListItemText, ListItemIcon, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ContactsService } from '@/lib/services/contacts.service';
import EmptyState from '@/components/ui/Emptystate';
import { formatDate } from '@/lib/utils';
import Papa from 'papaparse';
import DataTable, { ColumnDef } from '../shared/DataTable';

export default function ContactsClient() {
    const [groups, setGroups] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingContacts, setLoadingContacts] = useState(false);

    // Add contact dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addName, setAddName] = useState('');
    const [addPhone, setAddPhone] = useState('');
    const [addEmail, setAddEmail] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const [addGroupId, setAddGroupId] = useState('');

    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState('');
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editGroupId, setEditGroupId] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const openEditContact = (c: any) => {
        setEditId(c.id);
        setEditName(c.firstName || '');
        setEditPhone(c.phone || '');
        setEditEmail(c.email || '');
        setEditGroupId(c.groupId || '');
        setEditError(null);
        setEditOpen(true);
    };

    const handleEditContact = async () => {
        if (!editPhone) return;
        if (!/^\+\d{7,15}$/.test(editPhone.replace(/\s/g, ''))) {
            setEditError('Phone number must start with + and contain 7-15 digits.');
            return;
        }
        setEditLoading(true); setEditError(null);
        try {
            const payload: any = {
                firstName: editName,
                
            };
            if (editEmail) payload.email = editEmail;
            payload.groupId = editGroupId === 'none' ? null : (editGroupId || null);

            await ContactsService.update(editId, payload);
            setEditOpen(false);
            loadContacts(selectedGroup);
            loadGroups();
        } catch (err: any) {
            setEditError(err.message ?? 'Failed to update contact');
        } finally {
            setEditLoading(false);
        }
    };


    // New group dialog
    const [groupOpen, setGroupOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupLoading, setGroupLoading] = useState(false);
    const [groupError, setGroupError] = useState<string | null>(null);

    // Import CSV Dialog
    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const loadGroups = async () => {
        try {
            const res = await ContactsService.getGroups();
            const data = res?.data ?? res ?? [];
            setGroups(Array.isArray(data) ? data : []);
        } catch {
            setGroups([]);
        }
    };

    const loadContacts = async (groupId?: string | null) => {
        setLoadingContacts(true);
        try {
            const res = await ContactsService.getAll(groupId || undefined);
            const data = res?.data ?? res ?? [];
            setContacts(Array.isArray(data) ? data : []);
        } catch {
            setContacts([]);
        } finally {
            setLoadingContacts(false);
        }
    };

    useEffect(() => {
        Promise.all([loadGroups(), loadContacts(null)]).finally(() => setLoading(false));
    }, []);

    const handleGroupSelect = (id: string | null) => {
        setSelectedGroup(id);
        loadContacts(id);
    };

    const handleAddContact = async () => {
        if (!addPhone) return;
        if (!/^\+\d{7,15}$/.test(addPhone.replace(/\s/g, ''))) {
            setAddError('Phone number must start with + and contain 7-15 digits.');
            return;
        }
        setAddLoading(true); setAddError(null);
        try {
            const payload: any = {
                firstName: addName,
                phone: addPhone.replace(/\s/g, ''),
            };
            if (addEmail) payload.email = addEmail;
            
            payload.groupId = addGroupId === 'none' ? null : (addGroupId || selectedGroup || null);

            await ContactsService.create(payload);
            
            setAddOpen(false);
            setAddName(''); setAddPhone(''); setAddEmail(''); setAddGroupId('');
            loadContacts(selectedGroup);
            loadGroups();
        } catch (err: any) {
            setAddError(err.message ?? 'Failed to add contact');
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (!confirm('Delete this contact?')) return;
        try {
            await ContactsService.remove(id);
            loadContacts(selectedGroup);
        } catch { }
    };

    const handleCreateGroup = async () => {
        if (!groupName) return;
        setGroupLoading(true); setGroupError(null);
        try {
            await ContactsService.createGroup({ name: groupName });
            setGroupOpen(false); setGroupName('');
            loadGroups();
        } catch (err: any) {
            setGroupError(err.message ?? 'Failed to create group');
        } finally {
            setGroupLoading(false);
        }
    };

    const handleImportCSV = async () => {
        if (!importFile) return;
        setImportLoading(true); setImportError(null);

        Papa.parse(importFile, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data.map((row: any) => {
                        let rawPhone = String(row.phone || row.Phone || row.phoneNumber || row.PhoneNumber || row.Contact || '').trim();

                        if (rawPhone && !rawPhone.startsWith('+')) {
                            rawPhone = '+' + rawPhone;
                        }
                        return {
                            phone: rawPhone,
                            firstName: row.firstName || row.name || row.Name || row.first_name || '',
                            lastName: row.lastName || row.last_name || '',
                            email: row.email || row.Email || '',
                            custom1: row.custom1 || row.Custom1 || '',
                            custom2: row.custom2 || row.Custom2 || '',
                        };
                    }).filter((r: any) => r.phone && r.phone !== '+');

                    if (rows.length === 0) {
                        setImportError("No valid 'phone' column found in CSV.");
                        setImportLoading(false);
                        return;
                    }

                    const res = await ContactsService.bulkImport({
                        rows,
                        groupId: selectedGroup || undefined
                    });

                    setImportOpen(false);
                    setImportFile(null);

                    const imported = res?.imported ?? rows.length;
                    const skipped = res?.skipped ?? 0;
                    alert(`Import successful: ${imported} imported, ${skipped} skipped.`);
                    loadContacts(selectedGroup);
                } catch (err: any) {
                    setImportError(err.message || "Failed to import contacts");
                } finally {
                    setImportLoading(false);
                }
            },
            error: (err) => {
                setImportError(err.message);
                setImportLoading(false);
            }
        });
    };

    const handleDownloadTemplate = () => {
        // Create the CSV content with headers and a dummy row
        const csvContent = "phone,firstName,lastName,email,custom1,custom2\n+1234567890,John,Doe,john@example.com,VIP,Loyalty";


        // Create a fake downloadable link in the browser memory
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        // Force the download
        link.setAttribute("href", url);
        link.setAttribute("download", "contacts_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalContacts = contacts.length;
    const groupContacts = selectedGroup
        ? groups.find(g => g.id === selectedGroup)?.count ?? contacts.length
        : totalContacts;

    
    const columns: ColumnDef<any>[] = [
        { id: 'name', label: 'Name', render: (c) => <span style={{ fontWeight: 600 }}>{c.firstName ?? '-'}</span> },
        { id: 'phone', label: 'Phone', render: (c) => c.phone },
        { id: 'email', label: 'Email', render: (c) => <span style={{ color: '#64748b' }}>{c.email ?? '-'}</span> },
        { id: 'group', label: 'Group', render: (c) => groups.find(g => g.id === c.groupId)?.name ?? '-' },
        { id: 'dateAdded', label: 'Date Added', render: (c) => <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDate(c.createdAt)}</span> },
        { id: 'actions', label: 'Actions', render: (c) => (
            <>
                <Tooltip title="Edit"><IconButton size="small" sx={{ color: '#4f6ef7' }} onClick={() => openEditContact(c)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" sx={{ color: '#f44336' }} onClick={() => handleDeleteContact(c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </>
        ) }
    ];

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Contacts</Typography>
                    <Typography variant="body2" color="text.secondary">Manage your contact list and groups.</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportOpen(true)} sx={{ fontWeight: 600 }}>Import</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}
                        sx={{ bgcolor: '#4f6ef7', '&:hover': { bgcolor: '#3d5be0' }, fontWeight: 700, borderRadius: 2 }}>
                        Add Contact
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left sidebar — groups */}
                <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, width: { xs: '100%', md: 220 }, flexShrink: 0 }}>
                    <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" fontWeight={700}>Groups</Typography>
                        <Tooltip title="New Group">
                            <IconButton size="small" onClick={() => setGroupOpen(true)}>
                                <GroupAddIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Divider />
                    <List dense disablePadding>
                        <ListItemButton
                            selected={selectedGroup === null}
                            onClick={() => handleGroupSelect(null)}
                            sx={{ px: 2, '&.Mui-selected': { bgcolor: '#eef2ff', color: '#4f6ef7' } }}
                        >
                            <ListItemIcon sx={{ minWidth: 30 }}><PeopleIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="All Contacts" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }} />
                        </ListItemButton>
                        {loading
                            ? Array.from({ length: 3 }).map((_, i) => <Box key={i} sx={{ px: 2, py: 1 }}><Skeleton /></Box>)
                            : groups.map(g => (
                                <ListItemButton
                                    key={g.id} selected={selectedGroup === g.id}
                                    onClick={() => handleGroupSelect(g.id)}
                                    sx={{ px: 2, '&.Mui-selected': { bgcolor: '#eef2ff', color: '#4f6ef7' } }}
                                >
                                    <ListItemText
                                        primary={g.name}
                                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                                        secondary={`${g.count ?? 0} contacts`}
                                        secondaryTypographyProps={{ fontSize: '0.72rem' }}
                                    />
                                </ListItemButton>
                            ))
                        }
                    </List>
                </Card>

                {/* Main contacts table */}
                <Card elevation={0} sx={{ border: '1px solid #e8eaf0', borderRadius: 3, flex: 1, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
                    <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {selectedGroup ? groups.find(g => g.id === selectedGroup)?.name ?? 'Group' : 'All Contacts'}
                            <Chip label={groupContacts} size="small" sx={{ ml: 1, fontWeight: 700 }} />
                        </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ p: -2 }}><DataTable columns={columns} data={contacts} loading={loadingContacts} emptyMessage="Add your first contact to get started." /></Box>
                </Card>
            </Box>

            
            {/* Add Contact Dialog */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Add Contact</DialogTitle>
                <DialogContent>
                    {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
                    <TextField fullWidth label="Full Name" value={addName} onChange={e => setAddName(e.target.value)} margin="normal" />
                    <TextField fullWidth label="Phone Number" placeholder="+94771234567" value={addPhone} onChange={e => setAddPhone(e.target.value)} margin="normal" helperText="International format (must start with +)" />
                    <TextField fullWidth label="Email (optional)" type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} margin="normal" />
                    <TextField
                        select
                        fullWidth
                        label="Group (Optional)"
                        value={addGroupId}
                        onChange={e => setAddGroupId(e.target.value)}
                        margin="normal"
                        SelectProps={{ native: true }}
                    >
                        <option value="none">None</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddContact} disabled={addLoading || !addPhone}
                        sx={{ bgcolor: '#4f6ef7', fontWeight: 700 }}>
                        {addLoading ? <CircularProgress size={18} color="inherit" /> : 'Add Contact'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Contact Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Edit Contact</DialogTitle>
                <DialogContent>
                    {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
                    <TextField fullWidth label="Full Name" value={editName} onChange={e => setEditName(e.target.value)} margin="normal" />
                    <TextField fullWidth label="Phone Number" placeholder="+94771234567" value={editPhone} disabled margin="normal" helperText="Phone numbers cannot be changed. Delete and recreate if needed." />
                    <TextField fullWidth label="Email (optional)" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} margin="normal" />
                    <TextField
                        select
                        fullWidth
                        label="Group (Optional)"
                        value={editGroupId}
                        onChange={e => setEditGroupId(e.target.value)}
                        margin="normal"
                        SelectProps={{ native: true }}
                    >
                        <option value="none">None</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleEditContact} disabled={editLoading || !editPhone}
                        sx={{ bgcolor: '#4f6ef7', fontWeight: 700 }}>
                        {editLoading ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>


            {/* New Group Dialog */}
            <Dialog open={groupOpen} onClose={() => setGroupOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>New Group</DialogTitle>
                <DialogContent>
                    {groupError && <Alert severity="error" sx={{ mb: 2 }}>{groupError}</Alert>}
                    <TextField fullWidth label="Group Name" placeholder="e.g. VIP Customers" value={groupName} onChange={e => setGroupName(e.target.value)} margin="normal" autoFocus />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setGroupOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateGroup} disabled={groupLoading || !groupName}
                        sx={{ bgcolor: '#4f6ef7', fontWeight: 700 }}>
                        {groupLoading ? <CircularProgress size={18} color="inherit" /> : 'Create Group'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Import CSV Dialog */}
            <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Import Contacts (CSV)</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload a CSV file containing your contacts. The file must include a <b>phone</b> column.
                        Optional columns: <b>name</b>, <b>firstName</b>, <b>lastName</b>.
                    </Typography>

                    <Button
                        variant="text"
                        size="small"
                        onClick={handleDownloadTemplate}
                        sx={{ mb: 3, fontWeight: 600, textTransform: 'none' }}
                    >
                        Download Sample CSV Template
                    </Button>
                    {importError && <Alert severity="error" sx={{ mb: 2 }}>{importError}</Alert>}

                    <Box
                        sx={{
                            border: '2px dashed #e8eaf0',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            bgcolor: '#fafbff',
                        }}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            id="csv-upload"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setImportFile(e.target.files[0]);
                                    setImportError(null);
                                }
                            }}
                        />
                        <label htmlFor="csv-upload">
                            <Button variant="outlined" component="span" startIcon={<UploadFileIcon />}>
                                Choose CSV File
                            </Button>
                        </label>
                        {importFile && (
                            <Typography variant="body2" sx={{ mt: 2, fontWeight: 600, color: '#4f6ef7' }}>
                                Selected: {importFile.name}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setImportOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleImportCSV} disabled={importLoading || !importFile}
                        sx={{ bgcolor: '#4f6ef7', fontWeight: 700 }}>
                        {importLoading ? <CircularProgress size={18} color="inherit" /> : 'Import'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}




