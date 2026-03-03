'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Clinic, ExpenseHead } from '@/lib/db/types';

interface ExpenseHeadWithClinic extends ExpenseHead {
  clinics: Clinic;
}

export default function ExpenseHeadsAdminPage() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHeadWithClinic[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpenseHead, setEditingExpenseHead] = useState<ExpenseHeadWithClinic | null>(null);
  const [deleteExpenseHeadId, setDeleteExpenseHeadId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clinic_id: '',
    name: '',
    active: true,
  });

  useEffect(() => {
    if (userRole !== 'SUPER_ADMIN') {
      router.push('/app');
      return;
    }
    loadData();
  }, [userRole]);

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [expenseHeadsResponse, clinicsResponse] = await Promise.all([
        fetch('/api/admin/expense-heads', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/admin/clinics', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
      ]);

      if (expenseHeadsResponse.ok) {
        const result = await expenseHeadsResponse.json();
        setExpenseHeads(result.data || []);
      }

      if (clinicsResponse.ok) {
        const result = await clinicsResponse.json();
        setClinics(result.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingExpenseHead(null);
    setFormData({
      clinic_id: clinics[0]?.id || '',
      name: '',
      active: true,
    });
    setDialogOpen(true);
  }

  function openEditDialog(expenseHead: ExpenseHeadWithClinic) {
    setEditingExpenseHead(expenseHead);
    setFormData({
      clinic_id: expenseHead.clinic_id,
      name: expenseHead.name,
      active: expenseHead.active,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = editingExpenseHead
        ? `/api/admin/expense-heads/${editingExpenseHead.id}`
        : '/api/admin/expense-heads';
      const method = editingExpenseHead ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save expense head');
      }
    } catch (error) {
      console.error('Error saving expense head:', error);
      alert('Failed to save expense head');
    }
  }

  async function handleDelete() {
    if (!deleteExpenseHeadId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/expense-heads/${deleteExpenseHeadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        setDeleteExpenseHeadId(null);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete expense head');
      }
    } catch (error) {
      console.error('Error deleting expense head:', error);
      alert('Failed to delete expense head');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expense Heads</h1>
          <p className="text-gray-600 mt-1">Manage expense categories across all clinics</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense Head
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Expense Heads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseHeads.map((expenseHead) => (
                  <TableRow key={expenseHead.id}>
                    <TableCell>{expenseHead.clinics.name}</TableCell>
                    <TableCell className="font-medium">{expenseHead.name}</TableCell>
                    <TableCell>
                      <Badge variant={expenseHead.active ? 'default' : 'secondary'}>
                        {expenseHead.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(expenseHead)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteExpenseHeadId(expenseHead.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpenseHead ? 'Edit Expense Head' : 'Create Expense Head'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clinic_id">Clinic</Label>
              <Select
                value={formData.clinic_id}
                onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}
              >
                <SelectTrigger id="clinic_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name} ({clinic.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteExpenseHeadId} onOpenChange={() => setDeleteExpenseHeadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense head.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
