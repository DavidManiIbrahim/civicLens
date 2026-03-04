import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHearings() {
    return useQuery({
        queryKey: ["hearings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("hearings")
                .select("*")
                .order("scheduled_at", { ascending: false });
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useCreateHearingMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newHearing: any) => {
            const { error } = await supabase.from("hearings").insert([newHearing] as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hearings"] });
        },
    });
}

export function useUpdateHearingMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase
                .from("hearings")
                .update({ status } as any)
                .eq("id", id as any);
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
            const { error } = await supabase.from("hearings").delete().eq("id", id as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hearings"] });
        },
    });
}

export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, display_name }: { userId: string; display_name: string }) => {
            const { error } = await supabase
                .from("profiles")
                .update({ display_name } as any)
                .eq("user_id", userId as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
        },
    });
}

export function useUpdateRoleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const { error } = await supabase
                .from("profiles")
                .update({ role } as any)
                .eq("user_id", userId as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
        },
    });
}

export function useProfiles() {
    return useQuery({
        queryKey: ["profiles"],
        queryFn: async () => {
            // join auth.users to get the email address
            const { data, error } = await supabase
                .from("profiles")
                .select("*, users(email)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useComments() {
    return useQuery({
        queryKey: ["comments"],
        queryFn: async () => {
            const { data, error } = await supabase.from("comments").select("*");
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useDeleteProfileMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            try {
                const { error: funcErr } = await supabase.functions.invoke("delete-user", {
                    body: { userId },
                });
                if (funcErr) throw funcErr;
            } catch (e) {
                console.warn("delete-user function failed", e);
            }

            const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("user_id", userId as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
            queryClient.invalidateQueries({ queryKey: ["comments"] });
        },
    });
}

export function useRecalculateSentimentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            const { data: comments, error: fetchError } = await supabase
                .from("comments")
                .select("id, text")
                .eq("user_id", userId as any);
            if (fetchError) throw fetchError;
            if (!comments) return;

            for (const c of comments as any[]) {
                try {
                    const { data: ai } = await supabase.functions.invoke("analyze-sentiment", {
                        body: { text: c.text, type: "sentiment" },
                    });
                    if (ai?.sentiment) {
                        await supabase
                            .from("comments")
                            .update({ sentiment: ai.sentiment } as any)
                            .eq("id", c.id as any);
                    }
                } catch (e) {
                    console.error("reanalyze comment failed", c.id, e);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments"] });
        },
    });
}