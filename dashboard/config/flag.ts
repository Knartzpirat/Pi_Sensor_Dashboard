import { CommandIcon, FileSpreadsheetIcon } from "lucide-react";



export type FlagConfig = typeof flagConfig;

export const flagConfig = [
  {
    key: 'advancedFilters',
    icon: FileSpreadsheetIcon,
  },
  {
    key: 'commandFilters',
    icon: CommandIcon,
  },
] as const;
