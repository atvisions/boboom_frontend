interface TokenDetailPageProps {
  params: { address: string };
}

export default function TokenDetailPage({ params }: TokenDetailPageProps) {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Token Details</h1>
      <p className="text-gray-400 mb-4">Address: {params.address}</p>
      <div className="text-gray-400 text-sm">Token detail page coming soon...</div>
    </div>
  );
}
