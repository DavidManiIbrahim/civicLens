export default function TopicCloud() {
  return (
    <div className="flex min-h-[150px] items-center justify-center p-8 text-center bg-muted/20 rounded-lg">
      <div className="max-w-xs">
        <p className="text-sm font-medium text-muted-foreground">
          AI Topic Engine is currently analyzing transcripts...
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Key themes and trending topics will appear here once the next analysis cycle completes.
        </p>
      </div>
    </div>
  );
}
