export type LogoVariant = "dark" | "light";

export default function Logo({
  variant = "dark",
  size = "md",
}: {
  variant?: LogoVariant;
  size?: "sm" | "md" | "lg";
}) {
  const h = size === "sm" ? 22 : size === "lg" ? 36 : 28;
  const fill = variant === "light" ? "#ffffff" : "#2B2820";
  const textMain = variant === "light" ? "text-white" : "text-[#2B2820]";
  const textSub = variant === "light" ? "text-white/70" : "text-[#2B2820]/60";
  const textSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-[19px]";

  return (
    <span className={`inline-flex items-center gap-2.5 select-none`}>
      <svg
        width={h * 0.88}
        height={h}
        viewBox="0 0 54 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Left crescent piece */}
        <path
          d="M9,9 A30,30 0 0 0 9,45 Q22,38 22,27 Q22,16 9,9 Z"
          fill={fill}
        />
        {/* Right thick D-bowl */}
        <path
          d="M28,2 A24,24 0 0 1 28,50 L28,38 A12,12 0 0 0 28,14 Z"
          fill={fill}
        />
      </svg>

      <span className={`font-bold tracking-tight leading-none ${textSize} ${textMain}`}>
        Done
        <span className={`font-normal ${textSub}`}> Jobs</span>
      </span>
    </span>
  );
}
