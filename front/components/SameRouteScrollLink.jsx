import Link from "next/link";
import { useRouter } from "next/router";

/** Next Link; si deja sur cette URL, le clic remonte la page en haut. */
export default function SameRouteScrollLink({ href, children, className, onClick, ...rest }) {
  const router = useRouter();
  const target = typeof href === "string" ? href.split("?")[0] : "";
  const current = router.asPath.split("?")[0];
  const isSame = Boolean(target) && current === target;

  return (
    <Link
      href={href}
      className={className}
      {...rest}
      onClick={(e) => {
        if (isSame) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}