type Props = {
  suggestion?: string;
};

export function PrepSuggestionCard({ suggestion }: Props) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-gray-500">Prep Suggestion</div>
      <div className="text-lg font-medium mt-1">{suggestion || "—"}</div>
    </div>
  );
}
