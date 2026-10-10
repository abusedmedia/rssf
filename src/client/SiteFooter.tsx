import { Link } from "react-router-dom";
import { ExternalLink } from "./ExternalLink";

export function LegalNav() {
  return (
    <nav className="legal-nav" aria-label="Legal">
      <Link to="/privacy">Privacy policy</Link>
      <Link to="/terms">Terms of service</Link>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        Operated by{" "}
        <ExternalLink href="https://fabiofranchino.com">
          Fabio Franchino
        </ExternalLink>
      </p>
      <LegalNav />
    </footer>
  );
}
