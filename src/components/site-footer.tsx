import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="brand" href="/">
        <Image className="brand-logo" src="/trio-brabo-logo.png" width={40} height={40} alt="Logo TrioBrabo" />
        <span className="brand-name">TrioBrabo <b>Games Drop</b></span>
      </Link>
      <div className="footer-signature">
        <strong>Construído e idealizado por Rogério Vieira para o Trio Brabo</strong>
        <p>Ofertas das respectivas lojas · Dados por <a href="https://www.gamerpower.com/" target="_blank" rel="noreferrer">GamerPower</a>.</p>
      </div>
    </footer>
  );
}
