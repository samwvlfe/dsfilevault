import { Header } from "@/components/header";
import { MainShell } from "@/components/mainshell";
import { Footer } from "@/components/footer";
import { terminal } from "@/app/fonts";

export default function Page() {
  return (
    <main className={terminal.className}>
      <Header />
      <MainShell />
      <Footer />
    </main>
  );
}