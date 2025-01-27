import Image from "next/image";
import { AudioVisualizer } from "./components/AudioVisualizer";

export default function Home() {
  return (
    <div className="grid items-center justify-items-center min-h-screen p-6">
      {/* <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
      </main> */}
      <AudioVisualizer />
    </div>
  );
}
