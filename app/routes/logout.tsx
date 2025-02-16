// remix-test-app/app/routes/logout.tsx
import { ActionFunction, redirect } from "@remix-run/node";
import { destroySession, getSession } from "../session.server";
import { Page, Card, Button } from "@shopify/polaris";
import { Form } from "@remix-run/react";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};

export default function Logout() {
  return (
    <Page title="Logout">
      <Card>
        <h1 className="text-2xl font-bold">Are you sure you want to log out?</h1>
        <Form method="post">
          <Button variant="primary" tone="critical">Confirm Logout</Button>
        </Form>
      </Card>
    </Page>
  );
}
