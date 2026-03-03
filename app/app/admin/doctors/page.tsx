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
import type { Clinic, Doctor } from '@/lib/db/types';

interface DoctorWithClinic extends Doctor {
  clinics: Clinic;
}

export default function DoctorsAdminPage() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [doctors, setDoctors] = useState<DoctorWithClinic[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorWithClinic | null>(null);
  const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clinic_id: '',
    code: '',
    name: '',
    rate: 0,
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

      const [doctorsResponse, clinicsResponse] = await Promise.all([
        fetch('/api/admin/doctors', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/admin/clinics', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
      ]);

      if (doctorsResponse.ok) {
        const result = await doctorsResponse.json();
        setDoctors(result.data || []);
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
    setEditingDoctor(null);
    setFormData({
      clinic_id: clinics[0]?.id || '',
      code: '',
      name: '',
      rate: 0,
      active: true,
    });
    setDialogOpen(true);
  }

  function openEditDialog(doctor: DoctorWithClinic) {
    setEditingDoctor(doctor);
    setFormData({
      clinic_id: doctor.clinic_id,
      code: doctor.code || '',
      name: doctor.name,
      rate: doctor.rate || 0,
      active: doctor.active,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = editingDoctor
        ? `/api/admin/doctors/${editingDoctor.id}`
        : '/api/admin/doctors';
      const method = editingDoctor ? 'PUT' : 'POST';

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
        alert(error.error || 'Failed to save doctor');
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Failed to save doctor');
    }
  }

  async function handleDelete() {
    if (!deleteDoctorId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/doctors/${deleteDoctorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        setDeleteDoctorId(null);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete doctor');
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Doctors</h1>
          <p className="text-gray-600 mt-1">Manage doctors across all clinics</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Doctor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{doctor.clinics.name}</TableCell>
                    <TableCell className="font-mono text-sm">{doctor.code}</TableCell>
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>${doctor.rate?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge variant={doctor.active ? 'default' : 'secondary'}>
                        {doctor.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(doctor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDoctorId(doctor.id)}
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
              {editingDoctor ? 'Edit Doctor' : 'Create Doctor'}
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
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="rate">Consultation Rate</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
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

      <AlertDialog open={!!deleteDoctorId} onOpenChange={() => setDeleteDoctorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the doctor.
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
