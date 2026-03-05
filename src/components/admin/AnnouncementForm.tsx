import { useState } from "react";
import { X, Send, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateAnnouncementMutation, useUpdateAnnouncementMutation } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";

interface AnnouncementFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: { id: string; title: string; content: string; is_published?: boolean };
}

export default function AnnouncementForm({ onClose, onSuccess, initialData }: AnnouncementFormProps) {
    const isEditMode = !!initialData;
    const { mutate: createAnnouncement, isPending: isCreating } = useCreateAnnouncementMutation();
    const { mutate: updateAnnouncement, isPending: isUpdating } = useUpdateAnnouncementMutation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        title: initialData?.title ?? "",
        content: initialData?.content ?? "",
    });

    const isPending = isCreating || isUpdating;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditMode && initialData) {
            updateAnnouncement({ id: initialData.id, title: formData.title, content: formData.content }, {
                onSuccess: () => {
                    toast({ title: "Post updated!" });
                    onSuccess();
                },
                onError: (err: any) => {
                    toast({ title: "Error", description: err.message, variant: "destructive" });
                }
            });
        } else {
            if (!user) return;
            createAnnouncement({
                title: formData.title,
                content: formData.content,
                author_id: user.id,
                is_published: true
            }, {
                onSuccess: () => {
                    toast({ title: "Post created!" });
                    onSuccess();
                },
                onError: (err: any) => {
                    toast({ title: "Error", description: err.message, variant: "destructive" });
                }
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevated">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-foreground">
                        {isEditMode ? "Edit Post" : "Create New Post"}
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted text-muted-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ann-title">Post Title</Label>
                        <Input id="ann-title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. New Policy Update" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ann-content">Content</Label>
                        <Textarea id="ann-content" required rows={6} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Write the announcement..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isPending} className="gap-2">
                            {isEditMode
                                ? <><Pencil className="h-4 w-4" />{isPending ? "Saving..." : "Save Changes"}</>
                                : <><Send className="h-4 w-4" />{isPending ? "Posting..." : "Create Post"}</>
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
