import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface HearingFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

import { useCreateHearingMutation, useUpdateHearingMutation } from "@/hooks/useData";

export default function HearingForm({ onClose, onSuccess, initialData }: HearingFormProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        committee: initialData?.committee || "",
        description: initialData?.description || "",
        scheduled_at: initialData?.scheduled_at
            ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        status: (initialData?.status || "upcoming") as "live" | "upcoming" | "archived",
        stream_url: initialData?.stream_url || ""
    });

    const createHearingMutation = useCreateHearingMutation();
    const updateHearingMutation = useUpdateHearingMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            scheduled_at: new Date(formData.scheduled_at).toISOString(),
        };

        if (initialData?.id) {
            updateHearingMutation.mutate({ id: initialData.id, ...payload }, {
                onSuccess: () => onSuccess(),
                onError: (err: any) => console.error("Error updating hearing:", err)
            });
        } else {
            createHearingMutation.mutate(payload, {
                onSuccess: () => onSuccess(),
                onError: (err: any) => console.error("Error creating hearing:", err)
            });
        }
    };

    const isPending = createHearingMutation.isPending || updateHearingMutation.isPending;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevated">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-foreground">
                        {initialData ? "Edit Hearing" : "Create New Hearing"}
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted text-muted-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Hearing Title</Label>
                        <Input
                            id="title"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Clean Air Amendment Act Review"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="committee">Committee</Label>
                        <Input
                            id="committee"
                            required
                            value={formData.committee}
                            onChange={e => setFormData({ ...formData, committee: e.target.value })}
                            placeholder="e.g. Education & Labor"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief overview of the hearing topics..."
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
                            <Input
                                id="scheduled_at"
                                type="datetime-local"
                                required
                                value={formData.scheduled_at}
                                onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Initial Status</Label>
                            <select
                                id="status"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="upcoming">Upcoming</option>
                                <option value="live">Live</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stream_url">Stream URL (YouTube Embed)</Label>
                        <Input
                            id="stream_url"
                            value={formData.stream_url}
                            onChange={e => setFormData({ ...formData, stream_url: e.target.value })}
                            placeholder="https://www.youtube.com/embed/..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending
                                ? (initialData ? "Saving..." : "Creating...")
                                : (initialData ? "Save Changes" : "Create Hearing")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
