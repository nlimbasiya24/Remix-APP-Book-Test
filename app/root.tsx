// remix-test-app/app/root.tsx
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, Form } from "@remix-run/react";
import { LoaderFunction, json, redirect } from "@remix-run/node";
import { getSession, destroySession } from "./session.server";
import { AppProvider, Frame, TopBar, Navigation, Page, Button, InlineStack } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

type LoaderData = {
  user: {
    first_name: string;
    last_name: string;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    const pathname = new URL(request.url).pathname;
    if (pathname !== "/login") {
      return redirect("/login");
    }
    return null;// Let login page render
  }

  return json<LoaderData>({ user });
};

export const action: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};

export default function AppLayout() {
  const data:any = useLoaderData();

  if(!data){
    return (
     <html lang="en">
      <head>
      <Meta />
      <Links />
    </head>
    <body>
      <AppProvider i18n={en}>
            <Outlet />
      </AppProvider>
      <ScrollRestoration />
      <Scripts />
      <LiveReload />
    </body>
  </html>
    ); 
  }

  const user = data?.user;

  const topBarMarkup = (
    <TopBar
      userMenu={
        <Form method="post">
          <Button submit variant="primary" tone="critical">Logout</Button>
        </Form>
      }
    />
  );

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          { label: "Profile", url: "/profile" },
          { label: "Authors", url: "/authors/list" },
        ]}
      />
    </Navigation>
  );

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider i18n={en}>
          <Frame topBar={topBarMarkup} navigation={navigationMarkup}>
            <Page title={`Welcome, ${user?.first_name} ${user?.last_name}`}>
              <Outlet />
            </Page>
          </Frame>
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
