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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Clinic } from '@/lib/db/types';

interface UserClinicAssignment {
  clinic_id: string;
  clinic: Clinic;
}

interface UserData {
  id: string;
  role: string;
  clinics: UserClinicAssignment[];
}

export default function UsersAdminPage() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [deleteData, setDeleteData] = useState<{ userId: string; clinicId: string } | null>(null);
  const [editData, setEditData] = useState<{ userId: string; clinicId: string; currentRole: string } | null>(null);

  const [formData, setFormData] = useState({
    user_id: '',
    clinic_id: '',
  });

  const [editFormData, setEditFormData] = useState({
    role: 'USER' as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
  });

  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    clinic_id: '',
    role: 'USER' as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
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

      const [usersResponse, clinicsResponse] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/admin/clinics', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
      ]);

      if (usersResponse.ok) {
        const result = await usersResponse.json();
        setUsers(result.data || []);
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

  function openAssignDialog(userId: string) {
    setSelectedUserId(userId);
    setFormData({ user_id: userId, clinic_id: '' });
    setDialogOpen(true);
  }

  async function handleAssign() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/users/${formData.user_id}/clinics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clinic_id: formData.clinic_id,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign clinic');
      }
    } catch (error) {
      console.error('Error assigning clinic:', error);
      alert('Failed to assign clinic');
    }
  }

  async function handleUnassign() {
    if (!deleteData) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/admin/users/${deleteData.userId}/clinics/${deleteData.clinicId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }
      );

      if (response.ok) {
        setDeleteData(null);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to unassign clinic');
      }
    } catch (error) {
      console.error('Error unassigning clinic:', error);
      alert('Failed to unassign clinic');
    }
  }

  async function handleCreateUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newUserData),
      });

      if (response.ok) {
        setCreateUserDialogOpen(false);
        setNewUserData({ email: '', password: '', clinic_id: '', role: 'USER' });
        loadData();
        alert('User created successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  }

  function openEditDialog(userId: string, currentRole: string) {
    setEditData({ userId, clinicId: '', currentRole });
    setEditFormData({ role: currentRole as 'USER' | 'ADMIN' | 'SUPER_ADMIN' });
    setEditDialogOpen(true);
  }

  async function handleEditRole() {
    if (!editData) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/admin/users/${editData.userId}/role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ role: editFormData.role }),
        }
      );

      if (response.ok) {
        setEditDialogOpen(false);
        setEditData(null);
        loadData();
        alert('Role updated successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-gray-600 mt-1">Manage user clinic assignments and roles</p>
        </div>
        <Button onClick={() => setCreateUserDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <div className="space-y-6">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg font-mono">{user.id}</CardTitle>
                        <Badge
                          variant={
                            user.role === 'SUPER_ADMIN'
                              ? 'default'
                              : user.role === 'ADMIN'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {user.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user.id, user.role)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openAssignDialog(user.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Clinic
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {user.clinics.length === 0 ? (
                      <p className="text-sm text-gray-500">No clinics assigned</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Clinic</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {user.clinics.map((assignment) => (
                            <TableRow key={assignment.clinic_id}>
                              <TableCell>{assignment.clinic.name}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {assignment.clinic.code}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setDeleteData({
                                      userId: user.id,
                                      clinicId: assignment.clinic_id,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Clinic to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user_id">User ID</Label>
              <Input id="user_id" value={formData.user_id} disabled />
            </div>
            <div>
              <Label htmlFor="clinic_id">Clinic</Label>
              <Select
                value={formData.clinic_id}
                onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}
              >
                <SelectTrigger id="clinic_id">
                  <SelectValue placeholder="Select clinic" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!formData.clinic_id}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new_user_clinic">Clinic</Label>
              <Select
                value={newUserData.clinic_id}
                onValueChange={(value) => setNewUserData({ ...newUserData, clinic_id: value })}
              >
                <SelectTrigger id="new_user_clinic">
                  <SelectValue placeholder="Select clinic" />
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
              <Label htmlFor="new_user_role">Role</Label>
              <Select
                value={newUserData.role}
                onValueChange={(value: any) => setNewUserData({ ...newUserData, role: value })}
              >
                <SelectTrigger id="new_user_role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!newUserData.email || !newUserData.password || !newUserData.clinic_id}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: any) => setEditFormData({ role: value })}
              >
                <SelectTrigger id="edit_role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteData} onOpenChange={() => setDeleteData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Clinic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user's access to this clinic.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnassign}>Unassign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
