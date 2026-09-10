import { Button } from "@/components/ui/button";
export function LoadStatus({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: Error | undefined;
  retry: () => void;
}) {
  if (loading) return <p role="status">加载中…</p>;
  if (error)
    return (
      <div role="alert">
        <p>{error.message}</p>
        <Button variant="outline" onClick={retry}>
          重试
        </Button>
      </div>
    );
  return null;
}
