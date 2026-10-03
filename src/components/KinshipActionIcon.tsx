import kinshipAction from "@/assets/kinship-action.png";

export default function KinshipActionIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <img src={kinshipAction} alt="" aria-hidden="true" className={className} />;
}