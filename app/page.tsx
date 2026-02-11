import { Header } from "@/components/header";
import { MainShell } from "@/components/mainshell";
import { Footer } from "@/components/footer";
import { appFont } from "@/app/fonts";

export default function Page() {
  return (
    <main className={appFont.className}>
      <Header />
      <MainShell />
      <Footer />
    </main>
  );
}