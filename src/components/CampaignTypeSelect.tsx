import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CAMPAIGN_TYPES = [
  {
    value: "outreach",
    label: "Sales outreach sequence",
    description:
      "A planned series of messages for introducing your business and starting new sales conversations.",
  },
  {
    value: "broadcast",
    label: "One-time announcement",
    description:
      "A single message sent once to a selected audience, such as a notice, update or product launch.",
  },
  {
    value: "follow_up",
    label: "Prospect follow-up",
    description:
      "A focused follow-up for prospects your team has already contacted or who have shown interest.",
  },
  {
    value: "event",
    label: "Event invitation",
    description:
      "Invite contacts to an event, then send reminders and attendance information from one campaign.",
  },
  {
    value: "client",
    label: "Client communication",
    description:
      "Send service updates, check-ins or other relationship messages to existing clients.",
  },
] as const;

type CampaignTypeSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  triggerId: string;
  helperId: string;
};

export function CampaignTypeSelect({
  value,
  onValueChange,
  disabled = false,
  triggerId,
  helperId,
}: CampaignTypeSelectProps) {
  const selectedType =
    CAMPAIGN_TYPES.find((campaignType) => campaignType.value === value) ?? CAMPAIGN_TYPES[0];

  return (
    <div className="space-y-2">
      <Select disabled={disabled} value={value} onValueChange={onValueChange}>
        <SelectTrigger id={triggerId} aria-describedby={helperId} className="h-10">
          <SelectValue>{selectedType.label}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-w-[min(28rem,calc(100vw-2rem))]">
          {CAMPAIGN_TYPES.map((campaignType) => (
            <SelectItem
              key={campaignType.value}
              value={campaignType.value}
              textValue={campaignType.label}
              className="items-start py-2.5"
            >
              <span className="block pr-2">
                <span className="block font-medium">{campaignType.label}</span>
                <span className="mt-0.5 block whitespace-normal text-xs leading-4 text-muted-foreground">
                  {campaignType.description}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div
        id={helperId}
        className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground"
      >
        <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>{selectedType.description}</span>
      </div>
    </div>
  );
}
