import { cookies } from "next/headers";

type Props = {
  searchParams: Promise<{
    next?: string;
    assetToken?: string;
  }>;
};

export default async function AccessPage(props: Props) {
  const { next = "/", assetToken = "" } = await props.searchParams;

  return (
    <main style={{ padding: 16 }}>
      <h1>Access</h1>

      <form method="POST" action="/api/access">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="assetToken" value={assetToken} />

        <div>
          <label>
            Access code
            <br />
            <input name="accessCode" type="password" required />
          </label>
        </div>

        <button type="submit">Continue</button>
      </form>
    </main>
  );
}

