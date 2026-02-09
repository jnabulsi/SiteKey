type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function AdminHomePage(props: Props) {
  const { orgSlug } = await props.params;

  return (
    <>
      <h1>Admin</h1>
      <p>Organisation: {orgSlug}</p>
      <p>Admin dashboard placeholder</p>
    </>
  );
}

