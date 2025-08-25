import { MainLayout } from "@/components/layout/MainLayout";
import { CreateTokenForm } from "@/components/create/CreateTokenForm";

export default function CreateTokenPage() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Create a New Token</h1>
        <CreateTokenForm />
      </div>
    </MainLayout>
  );
}

