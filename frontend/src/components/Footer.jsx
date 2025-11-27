import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-mist/70 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-ink/60">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <p className="font-display text-lg text-ink">MediFinder</p>
            <p className="mt-2 max-w-xs">Compare prices and book diagnostic tests and health packages near you.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-3 font-medium text-ink">Tests</p>
              <ul className="space-y-2">
                <li>X-Ray</li>
                <li>MRI</li>
                <li>CT Scan</li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-medium text-ink">Company</p>
              <ul className="space-y-2">
                <li>About</li>
                <li><Link to="/provider/login" className="hover:text-ink">For providers</Link></li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-medium text-ink">Support</p>
              <ul className="space-y-2">
                <li>Help center</li>
                <li>Contact us</li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-ink/40">© {new Date().getFullYear()} MediFinder. All rights reserved.</p>
      </div>
    </footer>
  );
}
