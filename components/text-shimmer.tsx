import { TextShimmer } from "@/components/ui/text-shimmer";
export function TextShimmerBasic() {
  return (
    <TextShimmer className="font-outfit text-sm text-primary" duration={1}>
      Processing wastewater data...
    </TextShimmer>
  );
}
