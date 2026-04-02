import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { UsersService } from "@/services/api/users.service";
import { queryKeys } from "@/services/query/keys";
import type { UserQueryParams } from "@/types/models/user";

export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params ?? {}),
    queryFn: () => UsersService.getAll(params).then((r) => r.data),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => UsersService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof UsersService.update>[1]) =>
      UsersService.update(id, payload).then((r) => r.data.data),
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.users.detail(user.id), user);
      qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      toast.success("User updated.");
    },
    onError: () => {
      toast.error("Failed to update user.");
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UsersService.delete(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      toast.success("User deleted.");
    },
    onError: () => {
      toast.error("Failed to delete user.");
    },
  });
}
