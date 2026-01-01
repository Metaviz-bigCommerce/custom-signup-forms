import NavBar from '@/components/NavBar';
import FormBuilder from '@/components/FormBuilder';

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <FormBuilder />
      </main>
    </div>
  );
}

