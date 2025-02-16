// remix-test-app/app/routes/index.tsx
import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getSession } from "../session.server";
import { Page, Card, Button,AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return redirect("/login");
  }
  return { user };
};

export default function Index() {
  const { user }:any = useLoaderData();

  return (
    <AppProvider i18n={en}>
    <Page title="Dashboard">
      <Card>
        <h1 className="text-2xl font-bold">Welcome, {user.first_name} {user.last_name}</h1>
        <Link to="/profile">
          <Button variant="primary">Go to Profile</Button>
        </Link>
      </Card>
    </Page>
    </AppProvider>
  );
}