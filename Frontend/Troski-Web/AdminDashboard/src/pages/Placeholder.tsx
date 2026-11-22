const Placeholder = ({ description }: { description: string }) => (
  <div className="rounded-2xl border border-dashed border-ink/20 bg-white px-6 py-16 text-center">
    <p className="text-lg font-semibold">Coming soon</p>
    <p className="mx-auto mt-2 max-w-sm text-sm text-ink/60">{description}</p>
  </div>
);

export default Placeholder;