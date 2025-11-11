import { TextScramble } from "@/components/ui/text-scramble";
export function TextScrambleCustomCharacterDuration() {
  return (
    <TextScramble
      className="font-mono text-sm"
      duration={1.2}
      characterSet=". "
    >
      How can I help you today?
    </TextScramble>
  );
}
