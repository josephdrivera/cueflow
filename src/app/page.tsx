import Link from 'next/link';
import CueSheetEditor from "@/components/CueSheetEditor";
import MainContainer from '@/components/MainContainer';

export default function Home() {
  return (
    <MainContainer>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Cue Sheet Editor</h1>
        <Link 
          href="/dashboard" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
      <CueSheetEditor />
    </MainContainer>
  );
}
