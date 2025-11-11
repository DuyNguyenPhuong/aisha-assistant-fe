import { TextLoop } from "@/components/ui/text-loop";
export function TextLoopBasic() {
  return (
    <TextLoop className="font-outfit text-sm">
      <span>How can I help with your wastewater operations today?</span>
      <span>Check water quality parameters</span>
      <span>Monitor equipment status</span>
      <span>View current pH and BOD levels</span>
      <span>Check compliance with regulatory limits</span>
      <span>Review active alerts</span>
      <span>Analyze treatment efficiency</span>
      <span>Control chemical dosing systems</span>
      <span>Generate water quality reports</span>
    </TextLoop>
  );
}
