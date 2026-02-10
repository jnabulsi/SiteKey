type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function AdminHomePage(props: Props) {
  const { orgSlug } = await props.params;

  return (
    <>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">
        Organisation: {orgSlug}
      </p>
    </>
  );
}
