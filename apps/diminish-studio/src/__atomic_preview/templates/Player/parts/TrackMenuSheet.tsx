/**
 * PART: TrackMenuSheet - منوی پایین ترک (Add to setlist / File info /
 * Offload from device / Delete from library) - عنوان وسط، هندل بالای شیت
 */
import { Theme, ThemeTokens } from "../../../tokens";
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerItem,
  DrawerClose,
} from "../../../molecules/Drawer/Drawer";
import { SetlistIcon, FileInfoIcon, OffloadIcon, TrashIcon } from "./icons";

export type TrackMenuAction = "setlist" | "info" | "offload" | "delete";

export type TrackMenuSheetProps = {
  tokens: ThemeTokens;
  theme: Theme;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  onAction: (a: TrackMenuAction) => void;
};

const ITEMS: { id: TrackMenuAction; label: string; Icon: React.FC<{ size?: number }>; danger?: boolean }[] = [
  { id: "setlist", label: "Add to setlist", Icon: SetlistIcon },
  { id: "info", label: "File info", Icon: FileInfoIcon },
  { id: "offload", label: "Offload from device", Icon: OffloadIcon },
  { id: "delete", label: "Delete from library", Icon: TrashIcon, danger: true },
];

export const TrackMenuSheet = ({ tokens: tk, theme, open, onOpenChange, title, onAction }: TrackMenuSheetProps) => (
  <Drawer tokens={tk} theme={theme} open={open} onOpenChange={onOpenChange}>
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerContent aria-label="Track menu" style={{ maxWidth: 560 }}>
        <DrawerHeader style={{ alignItems: "center", padding: "0 6px 10px" }}>
          <DrawerTitle style={{ fontSize: 20, textAlign: "center", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </DrawerTitle>
        </DrawerHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ITEMS.map(({ id, label, Icon, danger }) => (
            <DrawerItem
              key={id}
              danger={danger}
              onClick={() => onAction(id)}
              style={{ height: 54, fontSize: 16, justifyContent: "flex-start" }}
            >
              <span style={{ display: "flex", color: danger ? "#FB2C36" : tk.textPrimary }}>
                <Icon size={21} />
              </span>
              {label}
            </DrawerItem>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose
            style={{
              height: 48,
              borderRadius: 999,
              border: `1px solid ${tk.borderColor}`,
              background: "transparent",
              color: tk.textPrimary,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Cancel
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </DrawerPortal>
  </Drawer>
);
