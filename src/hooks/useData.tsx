import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export function useHearings() {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ["hearings"],
        queryFn: async (): Promise<Tables<"hearings">[]> => {
            const { data, error } = await supabase
                .from("hearings")
                .select("*")
                .order("scheduled_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });
}

export function useUpdateHearingMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase
                .from("hearings")
                .update({ status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hearings"] });
        },
    });
}

export function useDeleteHearingMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("hearings").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hearings"] });
        },
    });
}

export function useUpdateRoleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const { error } = await supabase
                .from("profiles")
                .update({ role })
                .eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
        },
    });
}

export function useUpdateAnnouncementMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
            const { error } = await supabase
                .from("announcements")
                .update({ is_published })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
        },
    });
}

export function useDeleteAnnouncementMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("announcements").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
        },
    });
}

export function useAnnouncements(onlyPublished = true) {
    return useQuery({
        queryKey: ["announcements", onlyPublished],
        queryFn: async () => {
            let query = supabase
                .from("announcements")
                .select("*")
                .order("created_at", { ascending: false });

            if (onlyPublished) {
                query = query.eq("is_published", true);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Tables<"announcements">[];
        },
    });
}

export function useProfiles() {
    return useQuery({
        queryKey: ["profiles"],
        queryFn: async (): Promise<Tables<"profiles">[]> => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });
}
