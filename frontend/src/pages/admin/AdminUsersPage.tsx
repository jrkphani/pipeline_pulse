import { Fragment, useState } from 'react';
import { Lock, Plus, UserCog } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminUsers } from '@/hooks/useAdmin';
import { USER_ROLE_LABELS } from '@/types/auth';
import type { UserRole } from '@/types/auth';
import type { AdminUser } from '@/types/admin';
import type { AccessLevel } from '@/types/admin';
import {
  RBAC_MATRIX,
  RBAC_ROLE_COLUMNS,
  RBAC_ROLE_SHORT_LABELS,
  RBAC_PERMISSION_GROUPS,
} from '@/types/admin';

// ---------------------------------------------------------------------------
// Role badge color map
// ---------------------------------------------------------------------------

const ROLE_BADGE_CLASSES: Partial<Record<UserRole, string>> = {
  ae: 'bg-purple-100 text-purple-800 border-purple-200',
  presales_consultant: 'bg-green-100 text-green-800 border-green-200',
  presales_sa: 'bg-amber-100 text-amber-800 border-amber-200',
  sdr: 'bg-gray-100 text-gray-700 border-gray-200',
  cro: 'bg-red-100 text-red-800 border-red-200',
  sales_ops: 'bg-teal-100 text-teal-800 border-teal-200',
  aws_alliance_manager: 'bg-blue-100 text-blue-800 border-blue-200',
  finance_manager: 'bg-gray-100 text-gray-700 border-gray-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
};

function getRoleBadgeClass(role: UserRole): string {
  return ROLE_BADGE_CLASSES[role] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: AdminUser['status'] }) {
  const colorMap: Record<AdminUser['status'], string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    break_glass: 'bg-red-500',
  };
  const labelMap: Record<AdminUser['status'], string> = {
    active: 'Active',
    inactive: 'Inactive',
    break_glass: 'Break-Glass',
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`inline-block h-2 w-2 rounded-full ${colorMap[status]}`} />
      {labelMap[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// RBAC access cell renderer
// ---------------------------------------------------------------------------

function AccessCell({ level, highlight }: { level: AccessLevel; highlight: boolean }) {
  const base = highlight ? 'bg-green-50' : '';
  switch (level) {
    case 'full':
      return <TableCell className={`text-center text-sm ${base}`}>&#10003;</TableCell>;
    case 'read':
      return <TableCell className={`text-center text-sm ${base}`}>&#128065;</TableCell>;
    case 'none':
      return (
        <TableCell className={`text-center text-sm text-muted-foreground ${base}`}>
          &mdash;
        </TableCell>
      );
  }
}

// ---------------------------------------------------------------------------
// Country options
// ---------------------------------------------------------------------------

const COUNTRY_OPTIONS = [
  { value: 'SG', label: 'Singapore (SG)' },
  { value: 'PH', label: 'Philippines (PH)' },
  { value: 'MY', label: 'Malaysia (MY)' },
] as const;

// ---------------------------------------------------------------------------
// All UserRole values for the select
// ---------------------------------------------------------------------------

const ALL_ROLES: UserRole[] = [
  'admin',
  'cro',
  'sales_manager',
  'sales_ops',
  'presales_manager',
  'ae',
  'sdr',
  'presales_consultant',
  'presales_sa',
  'aws_alliance_manager',
  'finance_manager',
];

// ---------------------------------------------------------------------------
// User List Tab
// ---------------------------------------------------------------------------

function UserListTab({
  users,
  isLoading,
  onEditUser,
}: {
  users: AdminUser[] | undefined;
  isLoading: boolean;
  onEditUser: (user: AdminUser) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                  {USER_ROLE_LABELS[user.role]}
                </Badge>
              </TableCell>
              <TableCell>
                <StatusDot status={user.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{user.last_active}</TableCell>
              <TableCell>{user.country}</TableCell>
              <TableCell>
                {user.status === 'break_glass' ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => onEditUser(user)}>
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit User Sheet
// ---------------------------------------------------------------------------

function EditUserSheet({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'ae');
  const [status, setStatus] = useState<'active' | 'inactive'>(
    user?.status === 'inactive' ? 'inactive' : 'active',
  );
  const [country, setCountry] = useState(user?.country ?? 'SG');

  // Reset form when user changes
  // (using key on Sheet is preferred, but state init covers open)

  function handleSave() {
    // TODO: wire to mutation
    console.log('Save user:', { id: user?.id, displayName, role, status, country });
    onClose();
  }

  return (
    <Sheet open={user !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Edit User
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4">
          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Display name</Label>
            <Input
              id="edit-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {USER_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'inactive')}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-country">Country scope</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="edit-country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info banner */}
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Role changes take effect at next login.
          </div>

          {/* Sales Ops access summary */}
          {role === 'sales_ops' && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
              <p className="font-medium">Sales Ops Access</p>
              <p className="mt-1">
                Full access to Reference Data, FX Rates, Doc AI Monitor, Q Tree Config,
                SOP Management, Model Config, Solution Catalog, Template Library,
                User Management, System Health, and Excel Import.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 border-t px-4 py-4">
          <Button className="flex-1" onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// RBAC Matrix Tab
// ---------------------------------------------------------------------------

function RBACMatrixTab() {
  const salesOpsIdx = RBAC_ROLE_COLUMNS.indexOf('sales_ops');

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>&#10003; Full access</span>
        <span>&#128065; Read-only</span>
        <span>&mdash; No access</span>
        <span>
          <span className="inline-block h-3 w-3 rounded-sm bg-green-50 border border-green-200 mr-1 align-middle" />
          Sales Ops column
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Permission</TableHead>
              {RBAC_ROLE_COLUMNS.map((role, colIdx) => (
                <TableHead
                  key={role}
                  className={`text-center text-xs ${colIdx === salesOpsIdx ? 'bg-green-50' : ''}`}
                >
                  {RBAC_ROLE_SHORT_LABELS[role]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {RBAC_PERMISSION_GROUPS.map((group) => (
              <Fragment key={group.group}>
                {/* Group header row */}
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={RBAC_ROLE_COLUMNS.length + 1}
                    className="text-xs font-semibold text-muted-foreground py-1.5"
                  >
                    {group.group}
                  </TableCell>
                </TableRow>

                {/* Permission rows */}
                {group.permissions.map((perm) => {
                  const isBreakGlass = perm.key === 'break_glass';
                  return (
                    <TableRow key={perm.key}>
                      <TableCell
                        className={`text-sm ${isBreakGlass ? 'text-red-600 font-medium' : ''}`}
                      >
                        {perm.label}
                      </TableCell>
                      {RBAC_ROLE_COLUMNS.map((role, colIdx) => {
                        const level = RBAC_MATRIX[role]?.[perm.key] ?? 'none';
                        const highlight = colIdx === salesOpsIdx;
                        return (
                          <AccessCell
                            key={`${perm.key}-${role}`}
                            level={level}
                            highlight={highlight}
                          />
                        );
                      })}
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { data: users, isLoading } = useAdminUsers();

  function handleInviteUser() {
    // TODO: replace with real invite modal
    console.log('Invite user clicked');
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-medium">User Management</h1>
          <p className="text-xs text-muted-foreground">
            Manage users, roles, and view the RBAC permission matrix.
          </p>
        </div>
        <Button size="sm" onClick={handleInviteUser}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Invite User
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">User List</TabsTrigger>
          <TabsTrigger value="rbac">RBAC Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UserListTab
            users={users}
            isLoading={isLoading}
            onEditUser={setSelectedUser}
          />
        </TabsContent>

        <TabsContent value="rbac" className="mt-4">
          <RBACMatrixTab />
        </TabsContent>
      </Tabs>

      <EditUserSheet
        key={selectedUser?.id ?? 'closed'}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
